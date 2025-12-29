CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE documents (id UUID PRIMARY KEY DEFAULT uuid_generate_v4());
