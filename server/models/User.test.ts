import { CollectionPermission } from "@shared/types";
import { buildUser, buildTeam, buildCollection } from "@server/test/factories";
import { getTestDatabase } from "@server/test/support";
import CollectionUser from "./CollectionUser";
import UserAuthentication from "./UserAuthentication";

const db = getTestDatabase();

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date("2018-01-02T00:00:00.000Z"));
});

afterAll(() => {
  jest.useRealTimers();
  db.disconnect();
});

beforeEach(db.flush);

describe("user model", () => {
  describe("destroy", () => {
    it("should delete user authentications", async () => {
      const user = await buildUser();
      expect(await UserAuthentication.count()).toBe(1);
      await user.destroy();
      expect(await UserAuthentication.count()).toBe(0);
    });
  });

  describe("getJwtToken", () => {
    it("should set JWT secret", async () => {
      const user = await buildUser();
      expect(user.getJwtToken()).toBeTruthy();
    });
  });

  describe("availableTeams", () => {
    it("should return teams where another user with the same email exists", async () => {
      const user = await buildUser();
      const anotherUser = await buildUser({ email: user.email });

      const response = await user.availableTeams();
      expect(response.length).toEqual(2);
      expect(response[0].id).toEqual(user.teamId);
      expect(response[1].id).toEqual(anotherUser.teamId);
    });
  });

  describe("collectionIds", () => {
    it("should return read_write collections", async () => {
      const team = await buildTeam();
      const user = await buildUser({
        teamId: team.id,
      });
      const collection = await buildCollection({
        teamId: team.id,
        permission: CollectionPermission.ReadWrite,
      });
      const response = await user.collectionIds();
      expect(response.length).toEqual(1);
      expect(response[0]).toEqual(collection.id);
    });
    it("should return read collections", async () => {
      const team = await buildTeam();
      const user = await buildUser({
        teamId: team.id,
      });
      const collection = await buildCollection({
        teamId: team.id,
        permission: CollectionPermission.Read,
      });
      const response = await user.collectionIds();
      expect(response.length).toEqual(1);
      expect(response[0]).toEqual(collection.id);
    });
    it("should not return private collections", async () => {
      const team = await buildTeam();
      const user = await buildUser({
        teamId: team.id,
      });
      await buildCollection({
        teamId: team.id,
        permission: null,
      });
      const response = await user.collectionIds();
      expect(response.length).toEqual(0);
    });
    it("should not return private collection with membership", async () => {
      const team = await buildTeam();
      const user = await buildUser({
        teamId: team.id,
      });
      const collection = await buildCollection({
        teamId: team.id,
        permission: null,
      });
      await CollectionUser.create({
        createdById: user.id,
        collectionId: collection.id,
        userId: user.id,
        permission: CollectionPermission.Read,
      });
      const response = await user.collectionIds();
      expect(response.length).toEqual(1);
      expect(response[0]).toEqual(collection.id);
    });
  });
});
