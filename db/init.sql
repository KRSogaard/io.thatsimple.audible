CREATE TABLE if not exists `books` (
	`Id` VARCHAR(124) NOT NULL,
	`link` TEXT,
	`title` VARCHAR(255),
	`author` VARCHAR(127),
	`author_id` VARCHAR(124),
	`narrators` TEXT,
	`series` TEXT,
	`series_id` VARCHAR(124),
	`series_link` TEXT,
	`book_number` VARCHAR(128),
	`length` INT,
	`released` INT,
	`summary` TEXT,
	PRIMARY KEY (`Id`)
) ENGINE=InnoDB;