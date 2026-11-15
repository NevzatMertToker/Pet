import type { ProductType, Species } from "@patipaket/shared";

export interface SeedProduct {
  slug: string;
  name: string;
  brand: string;
  description: string;
  species: Species;
  type: ProductType;
  packageSize: string;
  /** Kuruş */
  price: number;
  compareAtPrice?: number;
  stock: number;
  suggestedIntervalWeeks: number;
  isFeatured?: boolean;
}

/**
 * Örnek katalog. Markalar kurgusaldır; gerçek ürünlerinizi yönetim panelinden
 * (/yonetim/urunler) ekleyip bunları pasife alabilirsiniz.
 */
export const SEED_PRODUCTS: SeedProduct[] = [
  /* ------------------------------------------------------------ kedi maması */
  {
    slug: "minnos-tavuklu-yetiskin-kedi-mamasi-1-5-kg",
    name: "Tavuklu Yetişkin Kedi Maması",
    brand: "Minnoş",
    description:
      "Taze tavuk etiyle hazırlanan, 1 yaş üstü kediler için tam ve dengeli kuru mama. Taurin ve omega yağ asitleriyle kalp sağlığını ve parlak tüyleri destekler.",
    species: "cat",
    type: "food",
    packageSize: "1,5 kg",
    price: 34990,
    stock: 120,
    suggestedIntervalWeeks: 4,
    isFeatured: true,
  },
  {
    slug: "minnos-somonlu-kisirlastirilmis-kedi-mamasi-10-kg",
    name: "Somonlu Kısırlaştırılmış Kedi Maması",
    brand: "Minnoş",
    description:
      "Kısırlaştırılmış kedilerin kilo kontrolü için düşük yağlı, yüksek proteinli formül. İdrar yolu sağlığını destekleyen mineral dengesine sahiptir.",
    species: "cat",
    type: "food",
    packageSize: "10 kg",
    price: 189900,
    compareAtPrice: 214900,
    stock: 60,
    suggestedIntervalWeeks: 8,
    isFeatured: true,
  },
  {
    slug: "pati-sef-tavuklu-yavru-kedi-mamasi-2-kg",
    name: "Tavuklu Yavru Kedi Maması",
    brand: "Pati Şef",
    description:
      "2–12 aylık yavru kediler için küçük taneli, enerji yoğun mama. DHA ile beyin ve göz gelişimini, kalsiyum ile kemik gelişimini destekler.",
    species: "cat",
    type: "food",
    packageSize: "2 kg",
    price: 48990,
    stock: 80,
    suggestedIntervalWeeks: 4,
  },
  {
    slug: "pati-sef-tahilsiz-kuzu-etli-kedi-mamasi-6-kg",
    name: "Tahılsız Kuzu Etli Kedi Maması",
    brand: "Pati Şef",
    description:
      "Hassas sindirimli kediler için tahıl içermeyen, tek hayvansal protein kaynaklı formül. Prebiyotik liflerle bağırsak florasını destekler.",
    species: "cat",
    type: "food",
    packageSize: "6 kg",
    price: 164900,
    stock: 45,
    suggestedIntervalWeeks: 6,
  },
  {
    slug: "minnos-ton-balikli-yas-kedi-mamasi-12-li",
    name: "Ton Balıklı Yaş Kedi Maması",
    brand: "Minnoş",
    description:
      "Jöle içinde ton balığı parçacıkları. Günlük su alımını artırmaya yardımcı olur; tek başına veya kuru mamaya ek olarak verilebilir.",
    species: "cat",
    type: "food",
    packageSize: "12 x 85 g",
    price: 35990,
    stock: 150,
    suggestedIntervalWeeks: 2,
  },
  /* -------------------------------------------------------------- kedi kumu */
  {
    slug: "temiz-pati-lavanta-kokulu-bentonit-kedi-kumu-10-l",
    name: "Lavanta Kokulu Bentonit Kedi Kumu",
    brand: "Temiz Pati",
    description:
      "İnce taneli, hızlı topaklanan doğal bentonit kum. Lavanta kokusu ve aktif karbon katkısıyla kötü kokuyu hapseder, az toz çıkarır.",
    species: "cat",
    type: "litter",
    packageSize: "10 L",
    price: 24990,
    stock: 200,
    suggestedIntervalWeeks: 2,
    isFeatured: true,
  },
  {
    slug: "temiz-pati-kokusuz-bentonit-kedi-kumu-20-l",
    name: "Kokusuz Bentonit Kedi Kumu",
    brand: "Temiz Pati",
    description:
      "Parfüme duyarlı kediler için kokusuz, ekstra emici bentonit kum. Sert topaklanır, kabın dibine yapışmaz. Ekonomik büyük boy.",
    species: "cat",
    type: "litter",
    packageSize: "20 L",
    price: 44990,
    compareAtPrice: 49990,
    stock: 140,
    suggestedIntervalWeeks: 4,
  },
  {
    slug: "tuy-yumagi-silika-kristal-kedi-kumu-7-6-l",
    name: "Silika Kristal Kedi Kumu",
    brand: "Tüy Yumağı",
    description:
      "Yüksek emiş gücüne sahip silika kristaller sıvıyı ve kokuyu içine hapseder. Tek kedi için bir pakette yaklaşık 4 hafta kullanım sağlar, tozsuzdur.",
    species: "cat",
    type: "litter",
    packageSize: "7,6 L",
    price: 32990,
    stock: 90,
    suggestedIntervalWeeks: 4,
  },
  {
    slug: "doga-kase-cam-peleti-kedi-kumu-10-kg",
    name: "Çam Peleti Kedi Kumu",
    brand: "Doğa Kase",
    description:
      "%100 doğal çam talaşından sıkıştırılmış pelet kum. Katkısızdır, doğada çözünür ve çamın kendi kokusuyla ferahlık verir.",
    species: "cat",
    type: "litter",
    packageSize: "10 kg",
    price: 28990,
    stock: 70,
    suggestedIntervalWeeks: 4,
  },
  /* -------------------------------------------------- kedi sarf malzemeleri */
  {
    slug: "temiz-pati-kum-kabi-poseti-10-lu",
    name: "Büzgülü Kum Kabı Poşeti",
    brand: "Temiz Pati",
    description:
      "Kum kabının içine serilen, büzgü ipli dayanıklı poşet. Kumu değiştirirken kabı yıkama zahmetini azaltır. Standart ve büyük kaplara uyar.",
    species: "cat",
    type: "supplies",
    packageSize: "10 adet",
    price: 12990,
    stock: 160,
    suggestedIntervalWeeks: 8,
  },
  {
    slug: "tuy-yumagi-kedi-islak-mendili-100-lu",
    name: "Kedi Temizlik Mendili",
    brand: "Tüy Yumağı",
    description:
      "Alkolsüz, aloe veralı ıslak mendil. Pati, tüy ve göz çevresinin günlük temizliği için uygundur; durulama gerektirmez.",
    species: "cat",
    type: "supplies",
    packageSize: "100 adet",
    price: 9990,
    stock: 180,
    suggestedIntervalWeeks: 6,
  },
  {
    slug: "pati-sef-tavuklu-kedi-odul-cubugu-15-li",
    name: "Tavuklu Sıvı Kedi Ödülü",
    brand: "Pati Şef",
    description:
      "Tüpten yalanarak yenen kremamsı ödül. Tek tek paketlidir; ilaç vermeyi ve tırnak kesimini kolaylaştırmak için idealdir.",
    species: "cat",
    type: "supplies",
    packageSize: "15 x 14 g",
    price: 18990,
    stock: 130,
    suggestedIntervalWeeks: 4,
  },
  /* ---------------------------------------------------------- köpek maması */
  {
    slug: "pati-sef-kuzu-etli-yetiskin-kopek-mamasi-15-kg",
    name: "Kuzu Etli Pirinçli Yetişkin Köpek Maması",
    brand: "Pati Şef",
    description:
      "Orta ve büyük ırk yetişkin köpekler için kuzu etli tam mama. Glukozamin ile eklem sağlığını, çinko ile deri ve tüy sağlığını destekler.",
    species: "dog",
    type: "food",
    packageSize: "15 kg",
    price: 224900,
    compareAtPrice: 249900,
    stock: 55,
    suggestedIntervalWeeks: 6,
    isFeatured: true,
  },
  {
    slug: "pati-sef-tavuklu-yavru-kopek-mamasi-3-kg",
    name: "Tavuklu Yavru Köpek Maması",
    brand: "Pati Şef",
    description:
      "2–12 aylık yavrular için yüksek proteinli büyüme maması. Küçük taneleri kolay çiğnenir; kolostrum ile bağışıklığı destekler.",
    species: "dog",
    type: "food",
    packageSize: "3 kg",
    price: 59990,
    stock: 75,
    suggestedIntervalWeeks: 4,
  },
  {
    slug: "doga-kase-tahilsiz-somonlu-kucuk-irk-kopek-mamasi-2-kg",
    name: "Tahılsız Somonlu Küçük Irk Köpek Maması",
    brand: "Doğa Kase",
    description:
      "10 kg altı köpekler için mini taneli, tahılsız formül. Somon ve tatlı patates ile hazırlanır; hassas mideler için uygundur.",
    species: "dog",
    type: "food",
    packageSize: "2 kg",
    price: 74990,
    stock: 65,
    suggestedIntervalWeeks: 4,
  },
  {
    slug: "pati-sef-biftekli-yas-kopek-mamasi-6-li",
    name: "Biftekli Yaş Köpek Maması",
    brand: "Pati Şef",
    description:
      "Sos içinde et parçaları içeren konserve mama. Tek başına öğün olarak veya kuru mamayı lezzetlendirmek için kullanılabilir.",
    species: "dog",
    type: "food",
    packageSize: "6 x 400 g",
    price: 41990,
    stock: 110,
    suggestedIntervalWeeks: 2,
  },
  /* ------------------------------------------------ köpek sarf malzemeleri */
  {
    slug: "temiz-pati-kopek-cis-pedi-60x90-30-lu",
    name: "Köpek Çiş Pedi 60x90 cm",
    brand: "Temiz Pati",
    description:
      "Beş katmanlı, jel emicili tuvalet eğitim pedi. Sızdırmaz tabanı zemini korur; yavru eğitimi ve yaşlı köpekler için uygundur.",
    species: "dog",
    type: "supplies",
    packageSize: "30 adet",
    price: 34990,
    stock: 150,
    suggestedIntervalWeeks: 4,
    isFeatured: true,
  },
  {
    slug: "temiz-pati-diski-torbasi-300-adet",
    name: "Lavanta Kokulu Dışkı Torbası",
    brand: "Temiz Pati",
    description:
      "Ekstra kalın, sızdırmaz ve kolay açılan yürüyüş torbaları. Standart tüm torba taşıyıcılarına uyar. 20 rulo, toplam 300 adet.",
    species: "dog",
    type: "supplies",
    packageSize: "20 rulo",
    price: 14990,
    stock: 220,
    suggestedIntervalWeeks: 12,
  },
  {
    slug: "tuy-yumagi-kopek-pati-temizleme-mendili-100-lu",
    name: "Pati Temizleme Mendili",
    brand: "Tüy Yumağı",
    description:
      "Yürüyüş dönüşü pati ve karın altı temizliği için büyük boy ıslak mendil. Alkolsüz ve parabensizdir.",
    species: "dog",
    type: "supplies",
    packageSize: "100 adet",
    price: 10990,
    stock: 170,
    suggestedIntervalWeeks: 6,
  },
  {
    slug: "pati-sef-dis-bakim-cubugu-28-li",
    name: "Diş Bakım Çubuğu",
    brand: "Pati Şef",
    description:
      "Günde bir adet çiğnetildiğinde tartar oluşumunu azaltmaya yardımcı olan X biçimli ödül çubuğu. Orta ırk köpekler içindir.",
    species: "dog",
    type: "supplies",
    packageSize: "28 adet",
    price: 27990,
    stock: 95,
    suggestedIntervalWeeks: 4,
  },
  /* --------------------------------------------------------------- kuş yemi */
  {
    slug: "kanatli-muhabbet-kusu-yemi-1-kg",
    name: "Vitaminli Muhabbet Kuşu Yemi",
    brand: "Kanatlı",
    description:
      "Kum darı, kuş yemi ve yulaf karışımı. İyot ve vitamin katkılıdır; tozdan arındırılmış, temiz tohumlarla hazırlanır.",
    species: "bird",
    type: "food",
    packageSize: "1 kg",
    price: 11990,
    stock: 200,
    suggestedIntervalWeeks: 6,
    isFeatured: true,
  },
  {
    slug: "kanatli-kanarya-yemi-1-kg",
    name: "Ötüm Destekli Kanarya Yemi",
    brand: "Kanatlı",
    description:
      "Kanarya tohumu, keten ve rapko içeren dengeli karışım. Parlak tüy ve canlı ötüş için zengin yağ asidi içeriğine sahiptir.",
    species: "bird",
    type: "food",
    packageSize: "1 kg",
    price: 12990,
    stock: 160,
    suggestedIntervalWeeks: 6,
  },
  {
    slug: "kanatli-meyveli-paraket-yemi-1-kg",
    name: "Meyveli Paraket ve Sultan Papağanı Yemi",
    brand: "Kanatlı",
    description:
      "Ayçiçeği, aspir, kurutulmuş meyve ve sebze parçacıkları içeren karışım. Sultan papağanı, cennet papağanı ve paraketler için uygundur.",
    species: "bird",
    type: "food",
    packageSize: "1 kg",
    price: 18990,
    stock: 100,
    suggestedIntervalWeeks: 4,
  },
  {
    slug: "kanatli-balli-kus-krakeri-10-lu",
    name: "Ballı Kuş Krakeri",
    brand: "Kanatlı",
    description:
      "Fırınlanmış tohumlardan yapılan, kafese asılabilen kraker. Gaga gelişimini destekler ve can sıkıntısını azaltır.",
    species: "bird",
    type: "food",
    packageSize: "10 adet",
    price: 8990,
    stock: 140,
    suggestedIntervalWeeks: 8,
  },
  /* --------------------------------------------------------------- kuş kumu */
  {
    slug: "kanatli-anasonlu-kus-kumu-4-lu",
    name: "Anasonlu Kuş Kumu",
    brand: "Kanatlı",
    description:
      "Kafes tabanına serilen, deniz kabuğu katkılı hijyenik kum. Sindirime yardımcı olur, anason kokusuyla kafesi ferah tutar.",
    species: "bird",
    type: "litter",
    packageSize: "4 x 350 g",
    price: 9990,
    stock: 180,
    suggestedIntervalWeeks: 4,
    isFeatured: true,
  },
  {
    slug: "kanatli-mineralli-kafes-kumu-1-kg",
    name: "Mineralli Kafes Kumu",
    brand: "Kanatlı",
    description:
      "Kalsiyum ve mineral bakımından zengin ince taneli grit kum. Taşlık sağlığını destekler; tüm kafes kuşları için uygundur.",
    species: "bird",
    type: "litter",
    packageSize: "1 kg",
    price: 6990,
    stock: 130,
    suggestedIntervalWeeks: 6,
  },
  /* --------------------------------------------------- kuş sarf malzemeleri */
  {
    slug: "kanatli-kafes-altlik-kagidi-50-li",
    name: "Kumlu Kafes Altlık Kağıdı",
    brand: "Kanatlı",
    description:
      "Kafes tepsisine serilen kum kaplı kağıt altlık. Değişimi saniyeler sürer, tırnakların doğal yolla törpülenmesine yardımcı olur.",
    species: "bird",
    type: "supplies",
    packageSize: "50 adet",
    price: 13990,
    stock: 120,
    suggestedIntervalWeeks: 8,
  },
  {
    slug: "kanatli-gaga-tasi-ve-kalamar-kemigi-3-lu",
    name: "Gaga Taşı ve Kalamar Kemiği Seti",
    brand: "Kanatlı",
    description:
      "Doğal kalsiyum kaynağı kalamar kemiği ve mineral gaga taşı. Gaga aşınmasını sağlar; askı aparatıyla birlikte gelir.",
    species: "bird",
    type: "supplies",
    packageSize: "3 adet",
    price: 7990,
    stock: 110,
    suggestedIntervalWeeks: 12,
  },
  {
    slug: "kanatli-tuy-dokum-vitamin-damlasi-30-ml",
    name: "Tüy Dökümü Vitamin Damlası",
    brand: "Kanatlı",
    description:
      "Tüy değişim döneminde suya damlatılarak kullanılan A, D3 ve E vitaminli takviye. Damlalıklı şişededir.",
    species: "bird",
    type: "supplies",
    packageSize: "30 ml",
    price: 14990,
    stock: 0,
    suggestedIntervalWeeks: 8,
  },
];
