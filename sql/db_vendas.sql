-- =====================================================================
-- db_vendas: vendedores, regiões, vendas, comissões e metas
-- Execução: mysql -u root -p < sql/db_vendas.sql   (MySQL 8.0.16+)
-- =====================================================================
CREATE DATABASE IF NOT EXISTS db_vendas
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_vendas;

DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS vendedores;
DROP TABLE IF EXISTS regioes;

CREATE TABLE vendedores (
  id_vendedor     INT AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(100)  NOT NULL,
  meta_mensal     DECIMAL(12,2) NOT NULL,
  percentual_base DECIMAL(5,2)  NOT NULL,
  ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_vendedor_meta  CHECK (meta_mensal > 0),
  CONSTRAINT chk_vendedor_perc  CHECK (percentual_base BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE regioes (
  id_regiao        INT AUTO_INCREMENT PRIMARY KEY,
  nome_regiao      VARCHAR(50)  NOT NULL UNIQUE,
  percentual_bonus DECIMAL(5,2) NOT NULL DEFAULT 0,
  CONSTRAINT chk_regiao_bonus CHECK (percentual_bonus >= 0)
) ENGINE=InnoDB;

CREATE TABLE vendas (
  id_venda       INT AUTO_INCREMENT PRIMARY KEY,
  id_vendedor    INT           NOT NULL,
  id_regiao      INT           NOT NULL,
  data_venda     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valor_venda    DECIMAL(12,2) NOT NULL,
  tipo_cliente   ENUM('PF','PJ') NOT NULL,
  valor_comissao DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_vendas_vendedor FOREIGN KEY (id_vendedor)
    REFERENCES vendedores (id_vendedor) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_vendas_regiao FOREIGN KEY (id_regiao)
    REFERENCES regioes (id_regiao) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_venda_valor CHECK (valor_venda > 0),
  INDEX idx_vendas_data (data_venda),
  INDEX idx_vendas_vendedor (id_vendedor),
  INDEX idx_vendas_regiao (id_regiao)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Dados de teste
-- ---------------------------------------------------------------------
INSERT INTO regioes (id_regiao, nome_regiao, percentual_bonus) VALUES
  (1, 'Norte',    1.00),
  (2, 'Nordeste', 1.00),
  (3, 'Sudeste',  0.00),
  (4, 'Sul',      0.50);

INSERT INTO vendedores (id_vendedor, nome, meta_mensal, percentual_base, ativo) VALUES
  (1, 'Ana Souza',      50000.00, 5.00, TRUE),
  (2, 'Bruno Lima',     40000.00, 4.00, TRUE),
  (3, 'Carla Mendes',   60000.00, 6.00, TRUE),
  (4, 'Diego Alves',    30000.00, 3.50, TRUE),
  (5, 'Eduarda Rocha',  45000.00, 5.50, TRUE);

-- valor_comissao = valor_venda * (base + bónus cliente + bónus região) / 100
INSERT INTO vendas (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao) VALUES
  (1, 1, 3, '2026-10-02 10:15:00', 20000.00, 'PJ', 1600.00),
  (2, 1, 1, '2026-10-08 14:30:00', 18000.00, 'PF', 1440.00),
  (3, 1, 4, '2026-10-15 09:45:00', 15000.00, 'PJ', 1275.00),
  (4, 2, 2, '2026-10-03 11:00:00', 12000.00, 'PF', 840.00),
  (5, 2, 3, '2026-10-10 16:20:00', 9000.00, 'PJ', 630.00),
  (6, 2, 4, '2026-10-20 13:10:00', 7500.00, 'PF', 487.50),
  (7, 3, 1, '2026-10-05 10:00:00', 25000.00, 'PJ', 2500.00),
  (8, 3, 3, '2026-10-12 15:40:00', 22000.00, 'PJ', 1980.00),
  (9, 3, 2, '2026-10-22 08:55:00', 16000.00, 'PF', 1440.00),
  (10, 4, 4, '2026-10-07 12:25:00', 8000.00, 'PF', 480.00),
  (11, 4, 2, '2026-10-18 17:05:00', 6500.00, 'PJ', 487.50),
  (12, 4, 1, '2026-09-28 10:30:00', 4000.00, 'PF', 260.00),
  (13, 5, 4, '2026-10-04 09:20:00', 30000.00, 'PJ', 2700.00),
  (14, 5, 3, '2026-10-14 14:50:00', 17000.00, 'PF', 1275.00),
  (15, 5, 1, '2026-09-15 11:35:00', 2500.00, 'PF', 212.50);

ALTER TABLE vendas AUTO_INCREMENT = 16;
