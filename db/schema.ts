// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    nickname: text("nickname").notNull(),
    password: text("password").notNull(),
    recovery: text("recovery").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [uniqueIndex("users_email").on(t.email)],
);
export const sessions = sqliteTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires").notNull(),
  },
  (t) => [index("session_expiry").on(t.expires)],
);
export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    content: text("content").notNull(),
    campus: text("campus").notNull(),
    category: text("category").notNull(),
    location: text("location").notNull().default(""),
    image: text("image"),
    status: text("status").notNull().default("open"),
    hidden: integer("hidden").notNull().default(0),
    created: integer("created").notNull(),
    updated: integer("updated").notNull(),
  },
  (t) => [
    index("posts_feed").on(t.hidden, t.created),
    index("posts_campus").on(t.campus, t.category, t.created),
    index("posts_author").on(t.authorId, t.created),
  ],
);
export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [index("comments_post").on(t.postId, t.created)],
);
export const reactions = sqliteTable(
  "reactions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId, t.kind] })],
);
export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull(),
    created: integer("created").notNull(),
    handled: integer("handled").notNull().default(0),
  },
  (t) => [uniqueIndex("reports_user_post").on(t.userId, t.postId)],
);
export const limits = sqliteTable("limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expires: integer("expires").notNull(),
});
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  owner: text("owner")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  created: integer("created").notNull(),
});
