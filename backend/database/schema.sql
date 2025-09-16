-- LitRPG Studio Database Schema

-- Series table
CREATE TABLE IF NOT EXISTS series (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    tags JSON,
    status VARCHAR(50) DEFAULT 'planning',
    target_books INT,
    author_notes TEXT,
    shared_elements JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(255) PRIMARY KEY,
    series_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    book_number INT NOT NULL,
    status VARCHAR(50) DEFAULT 'planning',
    target_word_count INT,
    current_word_count INT DEFAULT 0,
    synopsis TEXT,
    outline TEXT,
    character_arcs JSON,
    plot_threads JSON,
    timeline_events JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
    id VARCHAR(255) PRIMARY KEY,
    series_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    race VARCHAR(100),
    class VARCHAR(100),
    background TEXT,
    personality TEXT,
    appearance TEXT,
    stats JSON,
    skills JSON,
    inventory JSON,
    equipment JSON,
    status_effects JSON,
    level_progression JSON,
    relationships JSON,
    backstory TEXT,
    motivations TEXT,
    flaws TEXT,
    story_references JSON,
    cross_references JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE SET NULL
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(255) PRIMARY KEY,
    series_id VARCHAR(255),
    book_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    tags JSON,
    status VARCHAR(50) DEFAULT 'draft',
    word_count INT DEFAULT 0,
    target_word_count INT,
    summary TEXT,
    outline TEXT,
    setting TEXT,
    themes TEXT,
    plot_points JSON,
    character_roles JSON,
    story_events JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE SET NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id VARCHAR(255) PRIMARY KEY,
    story_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    chapter_number INT NOT NULL,
    content LONGTEXT,
    word_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    summary TEXT,
    notes TEXT,
    character_progression JSON,
    story_events JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Character Templates table
CREATE TABLE IF NOT EXISTS character_templates (
    id VARCHAR(255) PRIMARY KEY,
    character_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSON,
    is_public BOOLEAN DEFAULT 0,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

-- Story Templates table
CREATE TABLE IF NOT EXISTS story_templates (
    id VARCHAR(255) PRIMARY KEY,
    story_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSON,
    is_public BOOLEAN DEFAULT 0,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL
);

-- Series Analytics table
CREATE TABLE IF NOT EXISTS series_analytics (
    id VARCHAR(255) PRIMARY KEY,
    series_id VARCHAR(255) NOT NULL,
    total_word_count INT DEFAULT 0,
    average_book_length DECIMAL(10,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    character_count INT DEFAULT 0,
    location_count INT DEFAULT 0,
    plot_thread_count INT DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    readability_score DECIMAL(5,2) DEFAULT 0,
    pacing_data JSON,
    character_development_data JSON,
    world_building_depth JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_series_id ON books(series_id);
CREATE INDEX IF NOT EXISTS idx_books_book_number ON books(series_id, book_number);
CREATE INDEX IF NOT EXISTS idx_characters_series_id ON characters(series_id);
CREATE INDEX IF NOT EXISTS idx_stories_series_id ON stories(series_id);
CREATE INDEX IF NOT EXISTS idx_stories_book_id ON stories(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(story_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_analytics_series_id ON series_analytics(series_id);