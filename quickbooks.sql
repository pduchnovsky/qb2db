DROP TABLE profitandloss;

CREATE TABLE profitandloss (
    time TIMESTAMP NOT NULL,
    value NUMERIC not null
);

GRANT SELECT ON TABLE profitandloss TO grafana;

SELECT
  time,
  value
FROM profitandloss
