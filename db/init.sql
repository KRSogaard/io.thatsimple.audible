CREATE TABLE if not exists `books` (
	`id` INT NOT NULL,
	`book_id` VARCHAR(124) NOT NULL,
	`link` TEXT,
	`title` VARCHAR(255),
	`series` TEXT,
	`series_id` VARCHAR(124),
	`series_link` TEXT,
	`book_number` VARCHAR(128),
	`length` INT,
	`released` INT,
	`summary` TEXT,
	PRIMARY KEY (`Id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `tags` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`book_id` INT,
	`tag` VARCHAR(124),
	PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`)
        REFERENCES `books`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE if not exists `narrators` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`book_id` INT,
	`narrator` VARCHAR(124),
	PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`)
        REFERENCES `books`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE if not exists `authors` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`author_id` VARCHAR(124),
	`url` VARCHAR(124),
	`name` VARCHAR(124),
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `books_authors` (
	`id` INT AUTO_INCREMENT,
	`book_id` INT,
	`author_id` INT,
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
	`name` VARCHAR(124),
	`url` VARCHAR(124),
	`summary` TEXT,
	`last_updated` INT,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `series_books` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`series_id` INT,
	`book_id` INT,
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
	`username` VARCHAR(124),
	`password` VARCHAR(124),
	`password_salt` INT,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE if not exists `users_books` (
	`id` INT NOT NULL AUTO_INCREMENT,
	`user_id` INT,
	`book_id` INT,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB;
