ALTER TABLE `families` ADD `plan` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
-- 现存所有家庭一次性升级到 unlimited，避免老用户被新的免费配额误伤。
-- 后续新建家庭默认 'free'。
UPDATE `families` SET `plan` = 'unlimited';--> statement-breakpoint
CREATE INDEX `recipe_images_recipe_id_idx` ON `recipe_images` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipes_family_id_idx` ON `recipes` (`family_id`);