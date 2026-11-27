# EC2 yerləşdirməsi

Ünvan: http://13.49.1.59:8083/ — admin: /admin.

- SSH: ubuntu@ec2-13-49-1-59.eu-north-1.compute.amazonaws.com
- Tətbiq və build: /opt/incense-parfume
- Servis: incense-parfume.service (avtomatik start və qəza zamanı restart)
- Daxili port: yalnız 127.0.0.1:9083
- Verilənlər bazası və şəkillər: /var/lib/incense-parfume (d1 və r2)
- Admin sirri: /etc/incense-parfume.env (root:incense, 0640)
- Caddy konfiqurasiyası: /etc/caddy/Caddyfile
- Əvvəlki Caddy ehtiyat nüsxəsi: /etc/caddy/Caddyfile.before-incense-20261126

Hazır Cloudflare Worker build-i EC2-də workerd/Miniflare ilə işləyir; D1 və R2 məlumatları həmin serverin diskində saxlanır, Cloudflare idarə olunan yaddaşı deyil. Miniflare lokal emulyasiya qatıdır. Ayrıca systemd servisi, yalnız loopback girişi, məhdud yaddaş və yazı icazələri tətbiq olunub. Böyük istehsal yükü üçün idarə olunan Workers/D1/R2 və ya ayrıca Node/database portu planlaşdırılmalıdır.

Caddy yalnız Host=13.49.1.59 olan sorğuları 8083 portunda tətbiqə ötürür. Mövcud http://:8083 catch-all bloku başqa hostları abort edir. MF-* daxili başlıqları silinir və Miniflare daxili yolları bloklanır. Host məhdudiyyəti giriş autentifikasiyası deyil; IP ünvanı açıqdır. Bu endpoint HTTP-dir, HTTPS deyil.

Yoxlama: `sudo systemctl status incense-parfume`; log: `sudo journalctl -u incense-parfume -n 60`; restart: `sudo systemctl restart incense-parfume`.

Yeniləmə zamanı dist qovluğunu yeni production build ilə dəyişin, server.mjs və runtime paketlərini uyğunlaşdırın, sonra servisi restart edin. /var/lib/incense-parfume və /etc/incense-parfume.env faylını əvəz etməyin. Verilənlər üçün ehtiyat nüsxəni servisi dayandıraraq d1/r2 qovluqlarından birlikdə götürün. Lokal məlumatlar ilk yerləşdirmədə köçürülüb; sonrakı lokal redaktələr EC2 bazasına avtomatik keçmir.

Yerləşdirmə yoxlamaları: ana səhifə, kateqoriya və məhsul route-ları, JS/CSS, admin autentifikasiyası, icazəsiz yazıların rəddi, WhatsApp checkout, restart sonrası DB, host bloklaması və mövcud RentacarDost HTTPS cavabı.
