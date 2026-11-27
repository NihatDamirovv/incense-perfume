export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  size: number;
  gender: string;
  family: string;
  notes: string;
  description: string;
  image: string;
  available: boolean;
  origin?: string;
  seasons?: string[];
  variants?: { size: number; price: number; available: boolean }[];
};
export const samples: Product[] = [
  {
    id: "demo-1",
    name: "Aventus",
    brand: "Creed",
    price: 420,
    size: 100,
    gender: "Kişi",
    family: "Odunsu",
    notes: "Ananas · Ağcaqayın · Müşk",
    description:
      "Xarakterli, dərin və yadda qalan. Meyvə akkordları ilə odunsu notların zərif harmoniyası.",
    image: "",
    available: true,
  },
  {
    id: "demo-2",
    name: "Oud Wood",
    brand: "Tom Ford",
    price: 365,
    size: 50,
    gender: "Uniseks",
    family: "Odunsu",
    notes: "Ud · Səndəl · Hil",
    description:
      "İsti odunsu notlar və yumşaq ədviyyat çalarları ilə seçilən kompozisiya.",
    image: "",
    available: true,
  },
  {
    id: "demo-3",
    name: "Baccarat Rouge 540",
    brand: "Maison Francis Kurkdjian",
    price: 490,
    size: 70,
    gender: "Uniseks",
    family: "Şərq",
    notes: "Zəfəran · Yasəmən · Kəhrəba",
    description:
      "İşıqlı çiçək notları, isti kəhrəba və uzun müddət yadda qalan iz.",
    image: "",
    available: true,
  },
  {
    id: "demo-4",
    name: "Sauvage",
    brand: "Dior",
    price: 245,
    size: 100,
    gender: "Kişi",
    family: "Təravətli",
    notes: "Berqamot · İstiot · Ambroksan",
    description:
      "Açıq səmanı xatırladan təravət, ədviyyatlı və güclü bir xarakter.",
    image: "",
    available: true,
  },
  {
    id: "demo-5",
    name: "Silver Mountain Water",
    brand: "Creed",
    price: 390,
    size: 100,
    gender: "Uniseks",
    family: "Təravətli",
    notes: "Yaşıl çay · Qara qarağat · Müşk",
    description: "Sərin dağ havasından ilhamlanan təmiz və yüngül kompozisiya.",
    image: "",
    available: true,
  },
  {
    id: "demo-6",
    name: "N°5",
    brand: "Chanel",
    price: 280,
    size: 100,
    gender: "Qadın",
    family: "Çiçək",
    notes: "Aldehid · Qızılgül · Yasəmən",
    description: "Zamanın fövqündə olan çiçək akkordları ilə klassik zəriflik.",
    image: "",
    available: true,
  },
];
