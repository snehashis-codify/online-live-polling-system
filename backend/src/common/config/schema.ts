import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const quesTypeEnum = pgEnum("question_type", ["checkbox", "radio"]);
const pollStatusEnum = pgEnum("poll_status", ["draft", "active", "closed"]);

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
    hashLink: text("hash_link").notNull().unique(),
    status: pollStatusEnum().default("draft").notNull(),
    expTime: timestamp("exp_time"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("polls_creator_idx").on(table.creatorId)]
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("questions_poll_idx").on(table.pollId)]
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
  (table) => [index("options_question_idx").on(table.questionId)]
);

const usersRelations = relations(usersTable, ({ many }) => ({
  polls: many(pollTable),
}));

const pollRelations = relations(pollTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [pollTable.creatorId],
    references: [usersTable.id],
  }),
  questions: many(questionTable),
}));

const questionRelations = relations(questionTable, ({ one, many }) => ({
  poll: one(pollTable, {
    fields: [questionTable.pollId],
    references: [pollTable.id],
  }),
  options: many(optionsTable),
}));

const optionRelations = relations(optionsTable, ({ one }) => ({
  question: one(questionTable, {
    fields: [optionsTable.questionId],
    references: [questionTable.id],
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
  pollStatusEnum
};
