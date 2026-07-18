import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { isNotNull, relations } from "drizzle-orm";

const quesTypeEnum = pgEnum("question_type", ["checkbox", "radio"]);
const pollStatusEnum = pgEnum("poll_status", ["draft", "active", "closed"]);
const responseModeEnum = pgEnum("response_mode", [
  "anonymous",
  "authenticated",
]);
const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 45 }).notNull(),
  email: varchar("email", { length: 322 }).notNull().unique(),
  password: varchar("password", { length: 66 }),
  emailVerified: boolean("email_verified").default(false).notNull(),
  salt: text("salt"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

const pollTable = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 45 }).notNull(),
    creatorId: uuid("creator_id")
      .references(() => usersTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    linkToken: text("link_token").notNull().unique(),
    status: pollStatusEnum().default("draft").notNull(),
    responseMode: responseModeEnum("response_mode").default("anonymous").notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    expTime: timestamp("exp_time"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("polls_creator_idx").on(table.creatorId)],
);

const questionTable = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionType: quesTypeEnum().default("radio"),
    questionTitle: text("question_title").notNull(),
    pollId: uuid("poll_id")
      .references(() => pollTable.id, { onDelete: "cascade" })
      .notNull(),
    isMandatory: boolean("is_mandatory").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("questions_poll_idx").on(table.pollId)],
);

const optionsTable = pgTable(
  "options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    optionTitle: text("option_title").notNull(),
    optionValue: text("option_value").notNull(),
    questionId: uuid("question_id")
      .references(() => questionTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("options_question_idx").on(table.questionId)],
);

const responseTable = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .references(() => pollTable.id, { onDelete: "cascade" })
      .notNull(),
    respondentId: uuid("respondent_id").references(() => usersTable.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("poll_respondent_idx")
      .on(table.pollId, table.respondentId)
      .where(isNotNull(table.respondentId)),
    index("responses_poll_idx").on(table.pollId),
  ],
);

const answerTable = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .references(() => responseTable.id, { onDelete: "cascade" })
      .notNull(),
    optionId: uuid("option_id")
      .references(() => optionsTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("answers_response_idx").on(table.responseId),

    index("answers_option_idx").on(table.optionId),
  ],
);

const usersRelations = relations(usersTable, ({ many }) => ({
  polls: many(pollTable),
  responses: many(responseTable),
}));

const pollRelations = relations(pollTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [pollTable.creatorId],
    references: [usersTable.id],
  }),
  questions: many(questionTable),
  responses: many(responseTable),
}));

const questionRelations = relations(questionTable, ({ one, many }) => ({
  poll: one(pollTable, {
    fields: [questionTable.pollId],
    references: [pollTable.id],
  }),
  options: many(optionsTable),
}));

const optionRelations = relations(optionsTable, ({ one, many }) => ({
  question: one(questionTable, {
    fields: [optionsTable.questionId],
    references: [questionTable.id],
  }),
  answers: many(answerTable),
}));
const responseRelations = relations(responseTable, ({ one, many }) => ({
  poll: one(pollTable, {
    fields: [responseTable.pollId],
    references: [pollTable.id],
  }),
  responder: one(usersTable, {
    fields: [responseTable.respondentId],
    references: [usersTable.id],
  }),
  answers: many(answerTable),
}));

const answerRelations = relations(answerTable, ({ one, many }) => ({
  response: one(responseTable, {
    fields: [answerTable.responseId],
    references: [responseTable.id],
  }),
  option: one(optionsTable, {
    fields: [answerTable.optionId],
    references: [optionsTable.id],
  }),
}));
export {
  usersTable,
  pollTable,
  questionTable,
  optionsTable,
  usersRelations,
  pollRelations,
  questionRelations,
  optionRelations,
  quesTypeEnum,
  pollStatusEnum,
  responseModeEnum,
  responseTable,
  answerTable,
  responseRelations,
  answerRelations,
};
