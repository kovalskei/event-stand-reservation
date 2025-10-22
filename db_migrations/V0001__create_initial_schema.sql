-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица мероприятий
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    date VARCHAR(100),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица стендов
CREATE TABLE booths (
    id VARCHAR(50),
    event_id INTEGER REFERENCES events(id),
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    width FLOAT NOT NULL,
    height FLOAT NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    company VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, event_id)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_booths_event_id ON booths(event_id);
CREATE INDEX idx_booths_status ON booths(status);

-- Комментарии для понимания
COMMENT ON TABLE users IS 'Пользователи системы';
COMMENT ON TABLE events IS 'Мероприятия с выставочными стендами';
COMMENT ON TABLE booths IS 'Стенды на мероприятиях';