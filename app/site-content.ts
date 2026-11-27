export const defaultSettings = {
  siteName: "Incense Parfume",
  tagline: "ƏTİR BUTİKİ",
  logoImage: "",
  faviconImage: "",
  seoTitle: "Incense Parfume — Parfüm mağazası",
  seoDescription: "Seçilmiş parfümlər. Öz ətrinizi kəşf edin.",
  showAnnouncement: true,
  announcement: "",
  navCollection: "Kolleksiya",
  navBrands: "Brendlər",
  navAbout: "Haqqımızda",
  navContact: "Əlaqə",
  showHero: true,
  heroEyebrow: "PARFÜM MAĞAZASI",
  heroTitle: "Parfüm",
  heroEmphasis: "kolleksiyası",
  heroDescription: "Avropa və ərəb ətirlərini seçin.",
  heroButton: "Kolleksiyanı kəşf et",
  heroBadge: "NİŞ & DİZAYNER PARFÜMLƏRİ",
  heroLocation: "BAKI, AZƏRBAYCAN",
  heroCaption: "",
  heroBottleName: "L'ESSENCE",
  heroImage: "",
  heroImageAlt: "Ətir kolleksiyası",
  heroArtLabel: "INCENSE PARFUME",
  heroArtType: "EAU DE PARFUM",
  showBrands: true,
  brandsHeading: "ƏTİR DÜNYASININ İMZALARI",
  collectionEyebrow: "",
  collectionTitle: "Parfümlər",
  collectionDescription: "",
  sidebarCaption: "",
  sidebarQuote: "",
  showDemoNote: true,
  demoNote:
    "Nümunə kolleksiya: ilkin qiymətlər və flakon təsvirləri təqdimat üçündür.",
  showAbout: true,
  aboutEyebrow: "",
  aboutTitle: "Haqqımızda",
  aboutEmphasis: "",
  aboutText: "",
  aboutTextExtra: "",
  aboutButton: "Kolleksiyaya bax",
  aboutImage: "",
  showContact: true,
  contactTitle: "Bizimlə əlaqə",
  contactText: "Ətir seçiminizdə sizə kömək edək.",
  address: "",
  phone: "",
  email: "",
  instagram: "",
  whatsappNumber: "994507790084",
  orderIntro: "Salam! Aşağıdakı parfümləri sifariş etmək istəyirəm:",
  orderButton: "Sifariş et",
  cartButton: "Səbətə əlavə et",
  checkoutButton: "WhatsApp ilə sifariş et",
  footerText: "Bütün hüquqlar qorunur.",
  showAdminLink: true,
};
export type SiteSettings = {
  [K in keyof typeof defaultSettings]: (typeof defaultSettings)[K] extends boolean
    ? boolean
    : string;
};
export type Brand = {
  id: string;
  name: string;
  description: string;
  image: string;
  featured: boolean;
  sortOrder: number;
  count: number;
};
export type ContentField = {
  key: keyof SiteSettings;
  label: string;
  kind?: "text" | "textarea" | "image" | "toggle" | "phone" | "url" | "email";
  hint?: string;
};
export const contentGroups: {
  title: string;
  description: string;
  fields: ContentField[];
}[] = [
  {
    title: "Ümumi və menyu",
    description: "Saytın kimliyi və menyu adları.",
    fields: [
      { key: "siteName", label: "Saytın adı" },
      { key: "tagline", label: "Loqonun alt yazısı" },
      { key: "logoImage", label: "Loqo", kind: "image" },
      { key: "faviconImage", label: "Brauzer ikonası", kind: "image" },
      { key: "seoTitle", label: "Brauzer başlığı / SEO" },
      {
        key: "seoDescription",
        label: "Axtarış sistemi təsviri",
        kind: "textarea",
      },
      { key: "navCollection", label: "Kolleksiya menyusu" },
      { key: "navBrands", label: "Brendlər menyusu" },
      { key: "navAbout", label: "Haqqımızda menyusu" },
      { key: "navContact", label: "Əlaqə menyusu" },
    ],
  },
  {
    title: "Elan zolağı",
    description: "Saytın ən yuxarısındakı məlumat.",
    fields: [
      {
        key: "showAnnouncement",
        label: "Elan zolağını göstər",
        kind: "toggle",
      },
      { key: "announcement", label: "Elan mətni" },
    ],
  },
  {
    title: "Ana banner",
    description: "Başlıqlar, düymə və əsas şəkil.",
    fields: [
      { key: "showHero", label: "Ana banneri göstər", kind: "toggle" },
      { key: "heroEyebrow", label: "Üst başlıq" },
      { key: "heroTitle", label: "Əsas başlıq" },
      { key: "heroEmphasis", label: "İkinci sətir" },
      { key: "heroDescription", label: "Banner mətni", kind: "textarea" },
      { key: "heroButton", label: "Düymə mətni" },
      { key: "heroBadge", label: "Sol alt yazı" },
      { key: "heroLocation", label: "Sağ alt yazı" },
      {
        key: "heroImage",
        label: "Banner şəkli",
        kind: "image",
        hint: "Boş saxlasanız nümunə flakon göstərilir.",
      },
      { key: "heroImageAlt", label: "Şəklin təsviri" },
      {
        key: "heroCaption",
        label: "Şəkil üzərindəki üst yazı",
        kind: "textarea",
      },
      { key: "heroBottleName", label: "Nümunə flakon adı" },
      { key: "heroArtLabel", label: "Şəklin sol alt yazısı" },
      { key: "heroArtType", label: "Şəklin sağ alt yazısı" },
    ],
  },
  {
    title: "Kolleksiya",
    description: "Brend zolağı və kataloq mətnləri.",
    fields: [
      { key: "showBrands", label: "Brend zolağını göstər", kind: "toggle" },
      { key: "brandsHeading", label: "Brend zolağının başlığı" },
      { key: "collectionEyebrow", label: "Kataloq üst başlığı" },
      { key: "collectionTitle", label: "Kataloq başlığı" },
      {
        key: "collectionDescription",
        label: "Kataloq mətni",
        kind: "textarea",
      },
      { key: "sidebarCaption", label: "Filtrin alt başlığı" },
      { key: "sidebarQuote", label: "Filtrin alt mətni", kind: "textarea" },
      {
        key: "showDemoNote",
        label: "Nümunə kolleksiya qeydini göstər",
        kind: "toggle",
      },
      { key: "demoNote", label: "Kataloqun alt qeydi", kind: "textarea" },
    ],
  },
  {
    title: "Haqqımızda",
    description: "Mağazanızın hekayəsini yazın.",
    fields: [
      {
        key: "showAbout",
        label: "Haqqımızda bölməsini göstər",
        kind: "toggle",
      },
      { key: "aboutEyebrow", label: "Üst başlıq" },
      { key: "aboutTitle", label: "Əsas başlıq" },
      { key: "aboutEmphasis", label: "Başlığın ikinci sətri" },
      { key: "aboutText", label: "Əsas mətn", kind: "textarea" },
      { key: "aboutTextExtra", label: "Əlavə mətn", kind: "textarea" },
      { key: "aboutButton", label: "Düymə mətni" },
      { key: "aboutImage", label: "Haqqımızda şəkli", kind: "image" },
    ],
  },
  {
    title: "Əlaqə və WhatsApp",
    description: "Sifarişlərin yönləndiriləcəyi nömrə və əlaqə məlumatları.",
    fields: [
      {
        key: "whatsappNumber",
        label: "WhatsApp sifariş nömrəsi",
        kind: "phone",
        hint: "Ölkə kodu ilə: +994507790084",
      },
      {
        key: "orderIntro",
        label: "WhatsApp mesajının başlanğıcı",
        kind: "textarea",
      },
      { key: "orderButton", label: "Tək məhsul sifariş düyməsi" },
      { key: "cartButton", label: "Səbətə əlavə düyməsi" },
      { key: "checkoutButton", label: "Səbətin sifariş düyməsi" },
      { key: "showContact", label: "Əlaqə bölməsini göstər", kind: "toggle" },
      { key: "contactTitle", label: "Əlaqə başlığı" },
      { key: "contactText", label: "Əlaqə mətni", kind: "textarea" },
      { key: "address", label: "Ünvan" },
      { key: "phone", label: "Əlaqə telefonu" },
      { key: "email", label: "E-poçt", kind: "email" },
      { key: "instagram", label: "Instagram URL", kind: "url" },
    ],
  },
  {
    title: "Footer",
    description: "Səhifənin alt hissəsi.",
    fields: [
      { key: "footerText", label: "Hüquq / alt qeyd" },
      {
        key: "showAdminLink",
        label: "Admin panel keçidini göstər",
        kind: "toggle",
      },
    ],
  },
];
