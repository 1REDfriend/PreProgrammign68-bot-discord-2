-- CreateTable
CREATE TABLE "Ticket" (
    "guild_id" TEXT NOT NULL,
    "category_id" TEXT,
    "role_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("guild_id")
);

-- CreateTable
CREATE TABLE "TicketLog" (
    "logs_id" SERIAL NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "TicketLog_pkey" PRIMARY KEY ("logs_id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "message_id" SERIAL NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "fetch_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "UserLog" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "server_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "status" TEXT,
    "message_content" TEXT,

    CONSTRAINT "UserLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketLog_ticket_id_key" ON "TicketLog"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "TicketLog" ADD CONSTRAINT "TicketLog_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "Ticket"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "TicketLog"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;
