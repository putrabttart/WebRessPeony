insert into public.menus(title,description,icon,action_type,target_url,sort_order) values
('Daftar / Join Ress','Bergabung dan tumbuh bersama Peony','user','internal','/register',10),
('Pricelist Reseller','Akses khusus reseller Peony','price','internal','/dashboard/pricelist',20),
('Chanel Peony','Informasi terbaru di Telegram','telegram','telegram','/channel',30),
('Lapor Garansi','Ajukan dan pantau laporan garansi','warranty','internal','/dashboard/garansi',40)
on conflict do nothing;
