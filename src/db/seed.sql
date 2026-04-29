INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
	('istihdam', 'İstihdam', 'briefcase-business', 1),
	('egitim', 'Eğitim', 'graduation-cap', 2),
	('cevre', 'Çevre', 'leaf', 3),
	('sivil-katilim', 'Sivil Katılım', 'users', 4),
	('insan-haklari', 'İnsan Hakları', 'scale', 5),
	('afet-yonetimi', 'Afet Yönetimi', 'shield-alert', 6),
	('saglik', 'Sağlık', 'heart-pulse', 7),
	('iyi-yasam', 'İyi Yaşam', 'sparkles', 8),
	('erisilebilirlik-engellilik', 'Erişilebilirlik & Engellilik', 'accessibility', 9),
	('tarim-gida', 'Tarım & Gıda Teknolojileri', 'wheat', 10),
	('dongusel-ekonomi', 'Döngüsel Ekonomi & İleri Dönüşüm', 'recycle', 11);

INSERT OR IGNORE INTO audiences (id, name, icon, sort_order) VALUES
	('gencler', 'Gençler', 'users-round', 1),
	('cocuklar', 'Çocuklar', 'baby', 2),
	('kadinlar', 'Kadınlar', 'venus', 3),
	('engelliler', 'Engelliler', 'accessibility', 4),
	('yaslilar', 'Yaşlılar', 'hand-heart', 5),
	('multeciler', 'Mülteciler', 'home', 6),
	('hastalar', 'Hastalar', 'heart-pulse', 7),
	('hayvanlar', 'Hayvanlar', 'paw-print', 8),
	('dezavantajli-gruplar', 'Dezavantajlı Gruplar', 'circle-help', 9);

INSERT OR IGNORE INTO business_models (id, name, sort_order) VALUES
	('sosyal-girisim', 'Sosyal Girişim', 1),
	('sosyal-kooperatif', 'Sosyal Kooperatif', 2),
	('stk', 'Sivil Toplum Kuruluşu', 3),
	('inisiyatif', 'İnisiyatif', 4),
	('sorumlu-sirket', 'Sorumlu Şirket', 5),
	('ag-birlik', 'Ağ - Birlik', 6),
	('kulucka-merkezi', 'Kuluçka Merkezi', 7),
	('yatirimci', 'Yatırımcı', 8);

INSERT OR IGNORE INTO countries (code, name, flag, sort_order) VALUES
	('global', 'Global', '🌍', 0),
	('TR', 'Türkiye', '🇹🇷', 1),
	('DE', 'Almanya', '🇩🇪', 2),
	('GB', 'Birleşik Krallık', '🇬🇧', 3),
	('US', 'Amerika Birleşik Devletleri', '🇺🇸', 4),
	('NL', 'Hollanda', '🇳🇱', 5),
	('FR', 'Fransa', '🇫🇷', 6);

INSERT OR IGNORE INTO sdgs (id, name, color, logo_key) VALUES
	(1, 'Yoksulluğa Son', '#e5243b', 'sdgs/1.png'),
	(2, 'Açlığa Son', '#dda63a', 'sdgs/2.png'),
	(3, 'Sağlıklı ve Kaliteli Yaşam', '#4c9f38', 'sdgs/3.png'),
	(4, 'Nitelikli Eğitim', '#c5192d', 'sdgs/4.png'),
	(5, 'Toplumsal Cinsiyet Eşitliği', '#ff3a21', 'sdgs/5.png'),
	(6, 'Temiz Su ve Sanitasyon', '#26bde2', 'sdgs/6.png'),
	(7, 'Erişilebilir ve Temiz Enerji', '#fcc30b', 'sdgs/7.png'),
	(8, 'İnsana Yakışır İş ve Ekonomik Büyüme', '#a21942', 'sdgs/8.png'),
	(9, 'Sanayi, Yenilikçilik ve Altyapı', '#fd6925', 'sdgs/9.png'),
	(10, 'Eşitsizliklerin Azaltılması', '#dd1367', 'sdgs/10.png'),
	(11, 'Sürdürülebilir Şehirler ve Topluluklar', '#fd9d24', 'sdgs/11.png'),
	(12, 'Sorumlu Üretim ve Tüketim', '#bf8b2e', 'sdgs/12.png'),
	(13, 'İklim Eylemi', '#3f7e44', 'sdgs/13.png'),
	(14, 'Sudaki Yaşam', '#0a97d9', 'sdgs/14.png'),
	(15, 'Karasal Yaşam', '#56c02b', 'sdgs/15.png'),
	(16, 'Barış, Adalet ve Güçlü Kurumlar', '#00689d', 'sdgs/16.png'),
	(17, 'Amaçlar İçin Ortaklıklar', '#19486a', 'sdgs/17.png');

INSERT OR IGNORE INTO enterprises (
	id,
	slug,
	name,
	short_description,
	problem,
	solution,
	impact,
	long_content,
	website_url,
	instagram_url,
	status,
	is_featured
) VALUES
	(
		'ent-fazla',
		'fazla',
		'Fazla',
		'Gıda israfını azaltmak için fazla ürünleri ölçen, yöneten ve yeniden değerlendiren teknoloji girişimi.',
		'Perakende ve üretim zincirlerinde tüketilebilir gıda ürünleri sistematik olarak israf ediliyor.',
		'Fazla, işletmelerin fazla ürünlerini takip etmesini ve bağış, yeniden satış veya geri dönüşüm kanallarına aktarmasını sağlıyor.',
		'Binlerce ton ürünün israf olmadan ekonomiye ve ihtiyaç sahiplerine kazandırılmasına katkı sağladı.',
		'Fazla, döngüsel ekonomi yaklaşımını gıda tedarik zincirine taşıyan Türkiye merkezli sosyal girişim örneklerinden biridir.',
		'https://fazla.com',
		'https://www.instagram.com/fazla',
		'published',
		1
	),
	(
		'ent-blindlook',
		'blindlook',
		'BlindLook',
		'Görme engelliler için erişilebilir dijital deneyimler geliştiren sosyal girişim.',
		'Dijital ürünler ve hizmetler çoğu zaman görme engelliler için erişilebilir tasarlanmıyor.',
		'BlindLook, markaların erişilebilirlik olgunluğunu artıran denetim, sertifikasyon ve deneyim çözümleri sunuyor.',
		'Erişilebilir marka ağı ile binlerce görme engelli kullanıcının dijital hizmetlere erişimini kolaylaştırdı.',
		'BlindLook, erişilebilirliği yalnızca teknik uyumluluk değil, kapsayıcı müşteri deneyimi olarak ele alır.',
		'https://blindlook.com',
		'https://www.instagram.com/blindlook',
		'published',
		1
	),
	(
		'ent-apopo',
		'apopo',
		'APOPO',
		'Mayın tespiti ve tüberküloz taraması için eğitimli kahraman farelerle çalışan küresel sosyal girişim.',
		'Mayınlı alanlar toplulukların güvenliğini ve tarımsal üretimini yıllarca engelliyor.',
		'APOPO, özel eğitilmiş farelerle mayın tespiti ve hastalık tarama süreçlerini hızlandırıyor.',
		'Birçok ülkede mayın temizleme süreçlerine katkı sundu ve sağlık taramalarında erken teşhisi destekledi.',
		'APOPO, düşük maliyetli ve doğadan ilham alan bir yöntemle yüksek etkili sosyal fayda üretiyor.',
		'https://apopo.org',
		NULL,
		'published',
		1
	);

INSERT OR IGNORE INTO enterprise_categories (enterprise_id, category_id) VALUES
	('ent-fazla', 'cevre'),
	('ent-fazla', 'tarim-gida'),
	('ent-fazla', 'dongusel-ekonomi'),
	('ent-blindlook', 'erisilebilirlik-engellilik'),
	('ent-blindlook', 'insan-haklari'),
	('ent-apopo', 'afet-yonetimi'),
	('ent-apopo', 'saglik');

INSERT OR IGNORE INTO enterprise_audiences (enterprise_id, audience_id) VALUES
	('ent-fazla', 'dezavantajli-gruplar'),
	('ent-blindlook', 'engelliler'),
	('ent-apopo', 'dezavantajli-gruplar');

INSERT OR IGNORE INTO enterprise_business_models (enterprise_id, business_model_id) VALUES
	('ent-fazla', 'sosyal-girisim'),
	('ent-blindlook', 'sosyal-girisim'),
	('ent-apopo', 'sosyal-girisim');

INSERT OR IGNORE INTO enterprise_countries (enterprise_id, country_code) VALUES
	('ent-fazla', 'TR'),
	('ent-blindlook', 'TR'),
	('ent-apopo', 'global');

INSERT OR IGNORE INTO enterprise_sdgs (enterprise_id, sdg_id) VALUES
	('ent-fazla', 2),
	('ent-fazla', 12),
	('ent-fazla', 13),
	('ent-blindlook', 10),
	('ent-blindlook', 11),
	('ent-apopo', 3),
	('ent-apopo', 16);

INSERT OR IGNORE INTO editorial_lists (id, slug, title, description, status) VALUES
	(
		'list-cevre',
		'gida-israfini-azaltan-girisimler',
		'Gıda İsrafını Azaltan Sosyal İnovasyonlar',
		'Döngüsel ekonomi ve gıda teknolojileri kesişiminde çalışan örnek girişimler.',
		'published'
	);

INSERT OR IGNORE INTO editorial_list_items (editorial_list_id, enterprise_id, sort_order) VALUES
	('list-cevre', 'ent-fazla', 1);
