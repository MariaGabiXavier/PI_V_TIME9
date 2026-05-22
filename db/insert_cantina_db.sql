
-- COMPANY
INSERT INTO public.company_sched (id, cnpj, created_at, deleted, name) VALUES (2, '12.345.678/0001-00', '2026-04-30 10:26:08.603158', false, 'Cantina Sched');

-- USERS
INSERT INTO public.user_sched (id, created_at, deleted, email, name, password, role, company_id) VALUES (2, '2026-04-30 10:26:08.875531', false, 'cantina@gmail.com', 'ADMIN Cantina Sched', '$2a$10$fDwIm4VGDdYpqHcYUPEvMuJgmMqdRf6Ue2gRUjQeNDK0.dkFn59B2', 'ADMIN', 2);

-- PRODUCTS
INSERT INTO public.product_sched 
(id, category, created_at, deleted, is_perishable, name, price, unit_of_measure, company_id) 
VALUES
(1, 'Bebida', '2026-01-10 09:42:36', false, true, 'Suco Natural de Laranja 500ml', 6.50, 'UNIDADES', 2),

(2, 'Doce', '2026-01-11 10:15:22', false, true, 'Brigadeiro Gourmet', 3.50, 'UNIDADES', 2),

(3, 'Salgadinho', '2026-01-12 14:08:41', false, true, 'Coxinha de Frango', 7.00, 'UNIDADES', 2),

(4, 'Carne', '2026-01-13 18:30:10', false, true, 'Espetinho de Carne Bovina', 12.00, 'UNIDADES', 2);

-- STOCK
INSERT INTO public.stock_sched
(id, created_at, expiration_date, quantity, created_by_user_id, product_id)
VALUES
(1, '2026-01-14 17:24:36', '2026-01-20 17:24:36', 180, 2, 1), -- Suco Natural de Laranja

(2, '2026-01-15 09:10:12', '2026-01-25 09:10:12', 350, 2, 2), -- Brigadeiro Gourmet

(3, '2026-01-16 13:45:27', '2026-01-18 13:45:27', 420, 2, 3), -- Coxinha de Frango

(4, '2026-01-17 18:22:51', '2026-01-19 18:22:51', 160, 2, 4); -- Espetinho de Carne Bovina

-- SALES
INSERT INTO public.sale_sched
(id, sale_date, total_price, total_sold, product_id, sold_by_user_id)
VALUES

-- JANEIRO
(1,  '2026-01-05 09:15:22', 45.50, 7, 1, 2),
(2,  '2026-01-05 10:32:11', 35.00, 5, 3, 2),
(3,  '2026-01-06 14:20:45', 24.50, 7, 2, 2),
(4,  '2026-01-07 18:10:33', 60.00, 5, 4, 2),
(5,  '2026-01-08 12:45:19', 52.00, 8, 1, 2),
(6,  '2026-01-10 16:30:27', 70.00, 10, 3, 2),
(7,  '2026-01-12 08:55:41', 31.50, 9, 2, 2),
(8,  '2026-01-15 19:12:50', 84.00, 7, 4, 2),

-- FEVEREIRO
(9,  '2026-02-02 10:25:14', 39.00, 6, 1, 2),
(10, '2026-02-03 13:11:48', 49.00, 7, 3, 2),
(11, '2026-02-05 15:40:09', 21.00, 6, 2, 2),
(12, '2026-02-07 20:02:31', 96.00, 8, 4, 2),
(13, '2026-02-09 09:18:16', 58.50, 9, 1, 2),
(14, '2026-02-11 11:42:57', 77.00, 11, 3, 2),
(15, '2026-02-14 17:05:22', 28.00, 8, 2, 2),
(16, '2026-02-18 18:26:10', 120.00, 10, 4, 2),

-- MARÇO
(17, '2026-03-01 08:45:33', 65.00, 10, 1, 2),
(18, '2026-03-03 14:16:55', 91.00, 13, 3, 2),
(19, '2026-03-05 16:08:24', 35.00, 10, 2, 2),
(20, '2026-03-07 19:20:41', 108.00, 9, 4, 2),
(21, '2026-03-10 10:31:18', 52.00, 8, 1, 2),
(22, '2026-03-13 12:55:07', 84.00, 12, 3, 2),
(23, '2026-03-16 15:42:29', 42.00, 12, 2, 2),
(24, '2026-03-20 18:30:10', 132.00, 11, 4, 2),

-- ABRIL
(25, '2026-04-02 09:05:27', 71.50, 11, 1, 2),
(26, '2026-04-04 13:18:40', 98.00, 14, 3, 2),
(27, '2026-04-06 16:40:55', 38.50, 11, 2, 2),
(28, '2026-04-09 20:11:36', 120.00, 10, 4, 2),
(29, '2026-04-12 11:24:50', 58.50, 9, 1, 2),
(30, '2026-04-15 14:36:18', 105.00, 15, 3, 2),
(31, '2026-04-18 17:09:02', 45.50, 13, 2, 2),
(32, '2026-04-22 19:45:44', 144.00, 12, 4, 2),

-- MAIO
(33, '2026-05-03 08:14:29', 78.00, 12, 1, 2),
(34, '2026-05-05 12:25:33', 112.00, 16, 3, 2),
(35, '2026-05-08 15:47:16', 49.00, 14, 2, 2),
(36, '2026-05-10 18:30:58', 156.00, 13, 4, 2),
(37, '2026-05-13 10:16:22', 65.00, 10, 1, 2),
(38, '2026-05-16 13:55:49', 126.00, 18, 3, 2),
(39, '2026-05-20 16:42:37', 52.50, 15, 2, 2),
(40, '2026-05-21 19:10:11', 168.00, 14, 4, 2);

SELECT setval('company_sched_id_seq', (SELECT COALESCE(MAX(id),0) + 1 FROM company_sched), false);

SELECT setval('product_sched_id_seq', (SELECT COALESCE(MAX(id),0) + 1 FROM product_sched), false);

SELECT setval('user_sched_id_seq', (SELECT COALESCE(MAX(id),0) + 1 FROM user_sched), false);

SELECT setval('stock_sched_id_seq', (SELECT COALESCE(MAX(id),0) + 1 FROM stock_sched), false);

SELECT setval('sale_sched_id_seq', (SELECT COALESCE(MAX(id),0) + 1 FROM sale_sched), false); ta tudo certo ent?