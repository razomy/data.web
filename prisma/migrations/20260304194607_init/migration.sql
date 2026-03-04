-- CreateEnum
CREATE TYPE "fs_node_type" AS ENUM ('None', 'FileJson', 'FileStorageUrl', 'FileBinary', 'Directory');

-- CreateTable
CREATE TABLE "fs_node" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" STRING(255) NOT NULL,
    "type" "fs_node_type" NOT NULL,
    "content_json" JSONB,
    "content_binary" BYTES,
    "parent_id" UUID,
    "ancestors" UUID[],

    CONSTRAINT "fs_node_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ancestors" ON "fs_node" USING GIN ("ancestors");

-- CreateIndex
CREATE UNIQUE INDEX "fs_node_name_parent_id_key" ON "fs_node"("name", "parent_id");

-- AddForeignKey
ALTER TABLE "fs_node" ADD CONSTRAINT "fs_node_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "fs_node"("id") ON DELETE SET NULL ON UPDATE CASCADE;
