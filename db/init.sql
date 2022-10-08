CREATE TABLE if not exists `books` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`asin` VARCHAR(128) NOT NULL,
	`link` TEXT,
	`title` VARCHAR(255),
	`length` INT,
	`released` INT,
	`summary` TEXT,
	`last_updated` INT,
	`created` INT,
	PRIMARY KEY (`Id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `tags` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`book_id` INT,
	`tag` VARCHAR(128),
	`created` INT,
	PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`)
        REFERENCES `books`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE if not exists `narrators` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(128),
	`created` INT,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `narrators_books` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`book_id` INT,
	`narrator_id` INT,
	`created` INT,
	PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`)
        REFERENCES `books`(`id`)
        ON DELETE CASCADE,
  FOREIGN KEY (`narrator_id`)
        REFERENCES `narrators`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE if not exists `categories` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(128),
	`link` VARCHAR(512),
	`created` INT,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `categories_books` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`book_id` INT,
	`category_id` INT,
	`created` INT,
	PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`)
        REFERENCES `books`(`id`)
        ON DELETE CASCADE,
  FOREIGN KEY (`category_id`)
        REFERENCES `categories`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE if not exists `authors` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`asin` VARCHAR(128),
	`link` VARCHAR(512),
	`name` VARCHAR(128),
	`created` INT,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `books_authors` (
	`id` INT AUTO_INCREMENT,
	`book_id` INT,
	`author_id` INT,
	`created` INT,
	PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`)
        REFERENCES `books`(`id`)
        ON DELETE CASCADE,
  FOREIGN KEY (`author_id`)
        REFERENCES `authors`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE if not exists `series` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`asin` VARCHAR(128),
	`name` VARCHAR(128),
	`link` VARCHAR(512),
	`last_updated` INT,
	`created` INT,
	`summary` TEXT,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `series_books` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`series_id` INT,
	`book_id` INT,
	`book_number` VARCHAR(64),
	`created` INT,
	PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`)
        REFERENCES `books`(`id`)
        ON DELETE CASCADE,
  FOREIGN KEY (`series_id`)
        REFERENCES `series`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE if not exists `users` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`username` VARCHAR(128),
	`password` VARCHAR(128),
	`password_salt` VARCHAR(20),
	`email` VARCHAR(256),
	`created` INT,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `users_books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `book_id` int DEFAULT NULL,
  `created` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`)
        REFERENCES `books`(`id`)
        ON DELETE CASCADE
  FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `users_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `token` VARCHAR(128) DEFAULT NULL,
  `created` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;