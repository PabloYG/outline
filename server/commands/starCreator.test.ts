import { sequelize } from "@server/database/sequelize";
import { Star, Event } from "@server/models";
import { buildDocument, buildUser } from "@server/test/factories";
import { getTestDatabase } from "@server/test/support";
import starCreator from "./starCreator";

const db = getTestDatabase();

afterAll(db.disconnect);

beforeEach(db.flush);

describe("starCreator", () => {
  const ip = "127.0.0.1";

  it("should create star", async () => {
    const user = await buildUser();
    const document = await buildDocument({
      userId: user.id,
      teamId: user.teamId,
    });

    const star = await sequelize.transaction(async (transaction) =>
      starCreator({
        documentId: document.id,
        user,
        ip,
        transaction,
      })
    );

    const event = await Event.findOne();
    expect(star.documentId).toEqual(document.id);
    expect(star.userId).toEqual(user.id);
    expect(star.index).toEqual("P");
    expect(event!.name).toEqual("stars.create");
    expect(event!.modelId).toEqual(star.id);
  });

  it("should not record event if star is existing", async () => {
    const user = await buildUser();
    const document = await buildDocument({
      userId: user.id,
      teamId: user.teamId,
    });

    await Star.create({
      teamId: document.teamId,
      documentId: document.id,
      userId: user.id,
      createdById: user.id,
      index: "P",
    });

    const star = await sequelize.transaction(async (transaction) =>
      starCreator({
        documentId: document.id,
        user,
        ip,
        transaction,
      })
    );

    const events = await Event.count();
    expect(star.documentId).toEqual(document.id);
    expect(star.userId).toEqual(user.id);
    expect(star.index).toEqual("P");
    expect(events).toEqual(0);
  });
});
