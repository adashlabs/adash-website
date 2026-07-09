const fs = require('fs');
const path = require('path');
const sdk = require('node-appwrite');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
      env[key] = val;
    }
  });
}

const endpoint = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = env.APPWRITE_API_KEY;

if (!projectId || !apiKey || apiKey === 'your_appwrite_api_key_here' || projectId === 'your_appwrite_project_id_here') {
  console.error('\x1b[31mError: Lütfen .env.local dosyasındaki NEXT_PUBLIC_APPWRITE_PROJECT_ID ve APPWRITE_API_KEY değerlerini doldurun.\x1b[0m');
  process.exit(1);
}

// Initialize Client
const client = new sdk.Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);
const usersService = new sdk.Users(client);

const DATABASE_ID = 'apartman_yonetim';
const DATABASE_NAME = 'Apartman ve Site Yönetim Veritabanı';

const collections = [
  {
    id: 'users',
    name: 'Kullanıcı Profilleri',
    attributes: [
      { key: 'email', type: 'string', size: 100, required: true },
      { key: 'fullName', type: 'string', size: 100, required: true },
      { key: 'phone', type: 'string', size: 20, required: false },
      { key: 'role', type: 'string', size: 20, required: true }, // super_admin, manager, member
      { key: 'avatarId', type: 'string', size: 50, required: false },
      { key: 'createdAt', type: 'string', size: 30, required: true }
    ],
    indexes: [
      { key: 'idx_email', type: 'key', attributes: ['email'] }
    ]
  },
  {
    id: 'apartments',
    name: 'Apartmanlar',
    attributes: [
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'slug', type: 'string', size: 100, required: true },
      { key: 'description', type: 'string', size: 500, required: false },
      { key: 'coverImageId', type: 'string', size: 50, required: false },
      { key: 'logoImageId', type: 'string', size: 50, required: false },
      { key: 'address', type: 'string', size: 200, required: false },
      { key: 'managerId', type: 'string', size: 50, required: false },
      { key: 'blocksCount', type: 'integer', required: true },
      { key: 'floorsCount', type: 'integer', required: true },
      { key: 'unitsCount', type: 'integer', required: true },
      { key: 'rules', type: 'string', size: 200, required: false, array: true },
      { key: 'status', type: 'string', size: 20, required: true } // active, passive
    ],
    indexes: [
      { key: 'idx_slug', type: 'unique', attributes: ['slug'] }
    ]
  },
  {
    id: 'blocks',
    name: 'Bloklar',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'name', type: 'string', size: 50, required: true }
    ],
    indexes: [
      { key: 'idx_apartment', type: 'key', attributes: ['apartmentId'] }
    ]
  },
  {
    id: 'floors',
    name: 'Katlar',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'blockId', type: 'string', size: 50, required: true },
      { key: 'number', type: 'integer', required: true }
    ],
    indexes: [
      { key: 'idx_block', type: 'key', attributes: ['blockId'] }
    ]
  },
  {
    id: 'units',
    name: 'Daireler',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'blockId', type: 'string', size: 50, required: true },
      { key: 'floorId', type: 'string', size: 50, required: true },
      { key: 'number', type: 'string', size: 20, required: true },
      { key: 'type', type: 'string', size: 20, required: true }, // residential, commercial
      { key: 'tenantId', type: 'string', size: 50, required: false },
      { key: 'ownerId', type: 'string', size: 50, required: false },
      { key: 'status', type: 'string', size: 20, required: true } // occupied, empty
    ],
    indexes: [
      { key: 'idx_apartment', type: 'key', attributes: ['apartmentId'] }
    ]
  },
  {
    id: 'announcements',
    name: 'Duyurular',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 100, required: true },
      { key: 'content', type: 'string', size: 2000, required: true },
      { key: 'targetRole', type: 'string', size: 20, required: true }, // all, members, managers
      { key: 'isPinned', type: 'boolean', required: true },
      { key: 'createdBy', type: 'string', size: 50, required: true },
      { key: 'createdAt', type: 'string', size: 30, required: true }
    ],
    indexes: [
      { key: 'idx_apartment', type: 'key', attributes: ['apartmentId'] }
    ]
  },
  {
    id: 'maintenance_requests',
    name: 'Bakım ve Arıza Talepleri',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'unitId', type: 'string', size: 50, required: true },
      { key: 'category', type: 'string', size: 30, required: true }, // elevator, plumbing, electrical, cleaning, noise, other
      { key: 'title', type: 'string', size: 100, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
      { key: 'priority', type: 'string', size: 20, required: true }, // low, medium, high
      { key: 'status', type: 'string', size: 20, required: true }, // waiting, in_progress, completed
      { key: 'managerComment', type: 'string', size: 2000, required: false },
      { key: 'createdBy', type: 'string', size: 50, required: true },
      { key: 'createdAt', type: 'string', size: 30, required: true }
    ],
    indexes: [
      { key: 'idx_apartment', type: 'key', attributes: ['apartmentId'] }
    ]
  },
  {
    id: 'fees',
    name: 'Aidat ve Borçlar',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'unitId', type: 'string', size: 50, required: true },
      { key: 'userId', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 100, required: true },
      { key: 'amount', type: 'float', required: true },
      { key: 'dueDate', type: 'string', size: 30, required: true },
      { key: 'status', type: 'string', size: 20, required: true }, // pending, reviewing, paid
      { key: 'paidAt', type: 'string', size: 30, required: false }
    ],
    indexes: [
      { key: 'idx_user', type: 'key', attributes: ['userId'] },
      { key: 'idx_apartment', type: 'key', attributes: ['apartmentId'] }
    ]
  },
  {
    id: 'expenses',
    name: 'Giderler',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'category', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 100, required: true },
      { key: 'amount', type: 'float', required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'date', type: 'string', size: 30, required: true },
      { key: 'documentId', type: 'string', size: 50, required: false }
    ],
    indexes: [
      { key: 'idx_apartment', type: 'key', attributes: ['apartmentId'] }
    ]
  },
  {
    id: 'incomes',
    name: 'Gelirler',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'category', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 100, required: true },
      { key: 'amount', type: 'float', required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'date', type: 'string', size: 30, required: true }
    ],
    indexes: [
      { key: 'idx_apartment', type: 'key', attributes: ['apartmentId'] }
    ]
  },
  {
    id: 'documents',
    name: 'Belgeler',
    attributes: [
      { key: 'apartmentId', type: 'string', size: 50, required: true },
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'fileId', type: 'string', size: 50, required: true },
      { key: 'fileType', type: 'string', size: 20, required: false },
      { key: 'fileSize', type: 'integer', required: false },
      { key: 'uploadedAt', type: 'string', size: 30, required: true },
      { key: 'category', type: 'string', size: 50, required: false }
    ],
    indexes: [
      { key: 'idx_apartment', type: 'key', attributes: ['apartmentId'] }
    ]
  },
  {
    id: 'notifications',
    name: 'Bildirimler',
    attributes: [
      { key: 'userId', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 100, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'isRead', type: 'boolean', required: true },
      { key: 'type', type: 'string', size: 20, required: true }, // fee, announcement, maintenance, general
      { key: 'createdAt', type: 'string', size: 30, required: true }
    ],
    indexes: [
      { key: 'idx_user', type: 'key', attributes: ['userId'] }
    ]
  },
  {
    id: 'logs',
    name: 'Sistem Logları',
    attributes: [
      { key: 'userId', type: 'string', size: 50, required: true },
      { key: 'action', type: 'string', size: 50, required: true },
      { key: 'details', type: 'string', size: 1000, required: true },
      { key: 'createdAt', type: 'string', size: 30, required: true }
    ],
    indexes: [
      { key: 'idx_created', type: 'key', attributes: ['createdAt'] }
    ]
  }
];

async function waitForAttributes(collectionId) {
  console.log(`\x1b[36mKoleksiyon (${collectionId}) niteliklerinin hazır olması bekleniyor...\x1b[0m`);
  while (true) {
    const col = await databases.getCollection(DATABASE_ID, collectionId);
    const pending = col.attributes.filter(attr => attr.status !== 'available' && attr.status !== 'failed');
    if (pending.length === 0) {
      const failed = col.attributes.filter(attr => attr.status === 'failed');
      if (failed.length > 0) {
        console.error(`\x1b[31mUyarı: Bazı nitelikler oluşturulamadı (${collectionId}):`, failed.map(a => a.key), '\x1b[0m');
      }
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

async function setup() {
  try {
    console.log('Appwrite kurulumu başlatılıyor...');

    // 1. Database setup
    let dbExists = false;
    try {
      await databases.get(DATABASE_ID);
      dbExists = true;
      console.log('Veritabanı zaten mevcut.');
    } catch (e) {
      // Not found
    }

    if (!dbExists) {
      console.log('Veritabanı oluşturuluyor...');
      await databases.create(DATABASE_ID, DATABASE_NAME);
      console.log('Veritabanı oluşturuldu.');
    }

    // 2. Storage Buckets
    const buckets = [
      { id: 'documents', name: 'Apartman Belgeleri' },
      { id: 'images', name: 'Görseller ve Avatarlar' }
    ];

    for (const bucket of buckets) {
      try {
        await storage.getBucket(bucket.id);
        console.log(`Bucket (${bucket.id}) zaten mevcut.`);
      } catch (e) {
        console.log(`Bucket (${bucket.id}) oluşturuluyor...`);
        // permissions: role:all can read/write for dev simplicity
        await storage.createBucket(
          bucket.id,
          bucket.name,
          [sdk.Permission.read('any'), sdk.Permission.create('any'), sdk.Permission.update('any'), sdk.Permission.delete('any')],
          false, // fileSecurity
          true,  // enabled
          30 * 1024 * 1024, // 30MB
          undefined, // extensions
          undefined, // compression
          true, // encryption
          true // antivirus
        );
        console.log(`Bucket (${bucket.id}) oluşturuldu.`);
      }
    }

    // 3. Collections & Attributes
    for (const col of collections) {
      let colExists = false;
      try {
        await databases.getCollection(DATABASE_ID, col.id);
        colExists = true;
        console.log(`Koleksiyon (${col.id}) zaten mevcut.`);
      } catch (e) {}

      if (!colExists) {
        console.log(`Koleksiyon (${col.id}) oluşturuluyor...`);
        await databases.createCollection(
          DATABASE_ID,
          col.id,
          col.name,
          [sdk.Permission.read('any'), sdk.Permission.create('any'), sdk.Permission.update('any'), sdk.Permission.delete('any')]
        );
        console.log(`Koleksiyon (${col.id}) oluşturuldu. Nitelikler ekleniyor...`);

        for (const attr of col.attributes) {
          if (attr.type === 'string') {
            await databases.createStringAttribute(DATABASE_ID, col.id, attr.key, attr.size, attr.required, undefined, attr.array || false);
          } else if (attr.type === 'integer') {
            await databases.createIntegerAttribute(DATABASE_ID, col.id, attr.key, attr.required, undefined, undefined, undefined, attr.array || false);
          } else if (attr.type === 'float') {
            await databases.createFloatAttribute(DATABASE_ID, col.id, attr.key, attr.required, undefined, undefined, undefined, attr.array || false);
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(DATABASE_ID, col.id, attr.key, attr.required, undefined, attr.array || false);
          }
          // Slight delay between attributes
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Wait for attributes to be ready before moving forward
        await waitForAttributes(col.id);

        // Create Indexes
        if (col.indexes) {
          for (const idx of col.indexes) {
            console.log(`Index (${idx.key}) oluşturuluyor...`);
            try {
              await databases.createIndex(DATABASE_ID, col.id, idx.key, idx.type, idx.attributes);
            } catch (e) {
              console.error(`Index oluşturulurken hata (${idx.key}):`, e.message);
            }
          }
        }
      }
    }

    console.log('\x1b[32mAppwrite Şema Kurulumu Başarıyla Tamamlandı!\x1b[0m');
    console.log('Seed veriler oluşturuluyor...');
    await seed();
  } catch (error) {
    console.error('\x1b[31mKurulum sırasında hata oluştu:\x1b[0m', error);
  }
}

async function seed() {
  try {
    // Generate Seed Data
    console.log('Kullanıcılar oluşturuluyor...');

    // 1. Seed Users (Auth + DB)
    const seedUsers = [];
    
    // Super Admin
    seedUsers.push({
      id: 'super-admin',
      email: 'admin@siteyonetim.com',
      fullName: 'Ahmet Yılmaz (Süper Admin)',
      phone: '+905551112233',
      role: 'super_admin',
      password: 'Password123!'
    });

    // 3 Managers
    const managers = [
      { id: 'manager-1', name: 'Mustafa Demir', email: 'mustafa.demir@siteyonetim.com' },
      { id: 'manager-2', name: 'Zeynep Kaya', email: 'zeynep.kaya@siteyonetim.com' },
      { id: 'manager-3', name: 'Kemal Şahin', email: 'kemal.sahin@siteyonetim.com' }
    ];

    managers.forEach((m, i) => {
      seedUsers.push({
        id: m.id,
        email: m.email,
        fullName: m.name,
        phone: `+90555222334${i}`,
        role: 'manager',
        password: 'Password123!'
      });
    });

    // 46 Members
    const names = [
      'Ali', 'Veli', 'Ayşe', 'Fatma', 'Mehmet', 'Can', 'Ece', 'Seda', 'Bora', 'Cem',
      'Deniz', 'Elif', 'Fatih', 'Gizem', 'Hakan', 'Irmak', 'Kaan', 'Leyla', 'Murat', 'Nihan',
      'Onur', 'Pelin', 'Rıza', 'Selin', 'Tarkan', 'Umut', 'Yasin', 'Zehra', 'Aslı', 'Burak',
      'Ceyda', 'Doruk', 'Eren', 'Gamze', 'Hale', 'İlker', 'Jale', 'Koray', 'Melis', 'Nuri',
      'Oğuz', 'Pınar', 'Sabri', 'Tuğba', 'Uğur', 'Yeşim'
    ];
    const lastNames = ['Öztürk', 'Yıldız', 'Şen', 'Bulut', 'Çelik', 'Demirci', 'Kılıç', 'Tekin', 'Aksoy', 'Özkan'];

    for (let i = 1; i <= 46; i++) {
      const firstName = names[i % names.length];
      const lastName = lastNames[(i + 3) % lastNames.length];
      seedUsers.push({
        id: `member-${i}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@siteyonetim.com`,
        fullName: `${firstName} ${lastName}`,
        phone: `+90532${1000000 + i * 1530}`,
        role: 'member',
        password: 'Password123!'
      });
    }

    // Create in Auth
    for (const u of seedUsers) {
      try {
        await usersService.create(u.id, u.email, u.phone, u.password, u.fullName);
        // Verify email automatically so they can log in
        await usersService.updateEmailVerification(u.id, true);
        console.log(`Auth kullanıcısı oluşturuldu: ${u.email}`);
      } catch (e) {
        if (e.code === 409) {
          console.log(`Auth kullanıcısı zaten mevcut: ${u.email}`);
        } else {
          console.error(`Auth kullanıcısı oluşturulamadı: ${u.email}`, e.message);
        }
      }

      // Profile in Database
      try {
        await databases.createDocument(DATABASE_ID, 'users', u.id, {
          email: u.email,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role,
          createdAt: new Date().toISOString()
        });
        console.log(`Profil dökümanı oluşturuldu: ${u.email}`);
      } catch (e) {
        if (e.code === 409) {
          console.log(`Profil dökümanı zaten mevcut: ${u.email}`);
        } else {
          console.error(`Profil dökümanı oluşturulamadı: ${u.email}`, e.message);
        }
      }
    }

    // 2. Seed Apartments
    const seedApartments = [
      {
        id: 'apt-gunes',
        name: 'Güneş Apartmanı',
        slug: 'gunes-apartmani',
        description: 'Kadıköy\'ün merkezinde, 24 saat güvenlikli, otoparklı ve peyzaj alanlı modern yaşam kompleksi.',
        address: 'Osmanağa Mah. Güneş Sokak No:12 Kadıköy, İstanbul',
        managerId: 'manager-1',
        blocksCount: 1,
        floorsCount: 5,
        unitsCount: 20,
        rules: ['Evcil hayvan besleme kurallarına uyulmalıdır.', 'Ortak alan temizliğine dikkat edilmelidir.', 'Saat 22:00\'den sonra gürültü yapılmamalıdır.', 'Çöpler her akşam saat 19:00 - 20:00 arasında toplanacaktır.'],
        status: 'active'
      },
      {
        id: 'apt-yildiz',
        name: 'Yıldız Sitesi',
        slug: 'yildiz-sitesi',
        description: 'Çocuk oyun alanları, basketbol sahası ve geniş yeşil alanları ile aileler için huzurlu bir yaşam sitesi.',
        address: 'Barış Mah. Yıldızlar Caddesi No:4 Beylikdüzü, İstanbul',
        managerId: 'manager-2',
        blocksCount: 3,
        floorsCount: 8,
        unitsCount: 72,
        rules: ['Balkonlardan halı ve kilim silkelenmesi yasaktır.', 'Site içi hız limiti 20 km/s\'dir.', 'Açık havuz kullanım saatleri 09:00 - 20:00 arasındadır.', 'Misafir araçları sadece misafir otoparkına park edebilir.'],
        status: 'active'
      },
      {
        id: 'apt-yesilvadi',
        name: 'Yeşil Vadi Konakları',
        slug: 'yesil-vadi',
        description: 'Doğa ile iç içe, akıllı ev teknolojileriyle donatılmış, lüks ve konforlu butik konut projesi.',
        address: 'Göktürk Mah. Vadi Sokak No:2 Eyüpsultan, İstanbul',
        managerId: 'manager-3',
        blocksCount: 2,
        floorsCount: 4,
        unitsCount: 28,
        rules: ['Ortak alanlarda sigara içilmesi yasaktır.', 'Daire tadilatları sadece hafta içi 09:00 - 17:00 saatleri arasında yapılabilir.', 'Sığınak ve bodrum katlarında kişisel eşya depolanması yasaktır.'],
        status: 'active'
      }
    ];

    for (const apt of seedApartments) {
      try {
        await databases.createDocument(DATABASE_ID, 'apartments', apt.id, apt);
        console.log(`Apartman oluşturuldu: ${apt.name}`);
      } catch (e) {
        console.log(`Apartman zaten mevcut veya oluşturulamadı: ${apt.name}`);
      }
    }

    // 3. Seed Blocks, Floors & Units (Total 120 Units)
    // apt-gunes (1 Block, 5 Floors, 20 Units -> 4 units per floor)
    await createBlocksFloorsUnits('apt-gunes', 1, 5, 4, 1); // member-1 to member-20
    // apt-yesilvadi (2 Blocks, 4 Floors, 28 Units -> A block: 16 units (4 per floor), B block: 12 units (3 per floor))
    await createBlocksFloorsUnits('apt-yesilvadi', 2, 4, 4, 21); // member-21 to member-48
    // apt-yildiz (3 Blocks, 8 Floors, 72 Units) - we seed a subset of units in DB for speed but create the structure
    await createBlocksFloorsUnits('apt-yildiz', 3, 8, 3, 1); // Re-uses member mappings for simplicity

    // 4. Seed Announcements (20 announcements)
    console.log('Duyurular oluşturuluyor...');
    const categories = ['Genel', 'Bakım', 'Toplantı', 'Duyuru'];
    for (let i = 1; i <= 20; i++) {
      const aptId = i % 3 === 0 ? 'apt-gunes' : (i % 3 === 1 ? 'apt-yildiz' : 'apt-yesilvadi');
      const managerId = aptId === 'apt-gunes' ? 'manager-1' : (aptId === 'apt-yildiz' ? 'manager-2' : 'manager-3');
      try {
        await databases.createDocument(DATABASE_ID, 'announcements', `announcement-${i}`, {
          apartmentId: aptId,
          title: `${categories[i % categories.length]} Duyurusu - ${i}`,
          content: `Değerli sakinlerimiz, apartmanımızda/sitemizde gerçekleştireceğimiz çalışmalar kapsamında bilgilendirme yapmaktayız. Konuyla ilgili detaylar panoda ve yönetim ofisimizde mevcuttur. Lütfen kurallara uymaya özen gösterelim. Teşekkür ederiz.`,
          targetRole: i % 4 === 0 ? 'managers' : 'all',
          isPinned: i % 5 === 0,
          createdBy: managerId,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (e) {}
    }

    // 5. Seed Fees (40 fees)
    console.log('Aidatlar oluşturuluyor...');
    for (let i = 1; i <= 40; i++) {
      const memberNum = (i % 46) + 1;
      const aptId = memberNum <= 20 ? 'apt-gunes' : (memberNum <= 40 ? 'apt-yesilvadi' : 'apt-yildiz');
      const unitNum = (i % 20) + 1;
      const amount = aptId === 'apt-gunes' ? 450.0 : (aptId === 'apt-yesilvadi' ? 800.0 : 600.0);
      const statuses = ['pending', 'reviewing', 'paid'];
      const status = statuses[i % statuses.length];
      try {
        await databases.createDocument(DATABASE_ID, 'fees', `fee-${i}`, {
          apartmentId: aptId,
          unitId: `unit-${aptId}-A-${Math.floor(unitNum / 4) + 1}-${unitNum}`,
          userId: `member-${memberNum}`,
          title: `Temmuz 2026 Aidatı - Daire ${unitNum}`,
          amount: amount,
          dueDate: new Date(Date.now() + (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
          status: status,
          paidAt: status === 'paid' ? new Date().toISOString() : undefined
        });
      } catch (e) {}
    }

    // 6. Seed Maintenance Requests (30 requests)
    console.log('Talepler oluşturuluyor...');
    const reqCategories = ['elevator', 'plumbing', 'electrical', 'cleaning', 'noise', 'other'];
    const reqTitles = {
      elevator: 'Asansör gürültülü çalışıyor',
      plumbing: 'Bodrum katında su sızıntısı var',
      electrical: 'Bahçe aydınlatmaları yanmıyor',
      cleaning: 'Blok giriş temizliği yetersiz',
      noise: 'Üst kattan aşırı gürültü geliyor',
      other: 'Garaj kapısı yavaş açılıyor'
    };
    const priorities = ['low', 'medium', 'high'];
    const reqStatuses = ['waiting', 'in_progress', 'completed'];

    for (let i = 1; i <= 30; i++) {
      const memberNum = (i % 46) + 1;
      const aptId = memberNum <= 20 ? 'apt-gunes' : (memberNum <= 40 ? 'apt-yesilvadi' : 'apt-yildiz');
      const cat = reqCategories[i % reqCategories.length];
      const status = reqStatuses[i % reqStatuses.length];
      try {
        await databases.createDocument(DATABASE_ID, 'maintenance_requests', `request-${i}`, {
          apartmentId: aptId,
          unitId: `unit-${aptId}-A-1-1`,
          category: cat,
          title: reqTitles[cat],
          description: `Ortak alanımızda tespit edilen bu arızanın en kısa sürede çözülmesini rica ederim. Günlük yaşantımızı olumsuz etkilemektedir.`,
          priority: priorities[i % priorities.length],
          status: status,
          managerComment: status !== 'waiting' ? 'Ekiplere haber verildi, en kısa sürede müdahale edilecektir.' : undefined,
          createdBy: `member-${memberNum}`,
          createdAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString()
        });
      } catch (e) {}
    }

    // 7. Seed Incomes (20 incomes) & Expenses (20 expenses)
    console.log('Gelir-Gider kayıtları oluşturuluyor...');
    const incomeCategories = ['Aidat Geliri', 'Kira Geliri', 'Otopark Geliri', 'Bağış'];
    const expenseCategories = ['Asansör Bakımı', 'Temizlik Personeli', 'Elektrik Faturası', 'Peyzaj ve Bahçe', 'Ortak Alan Tamiratı'];

    for (let i = 1; i <= 20; i++) {
      const aptId = i % 3 === 0 ? 'apt-gunes' : (i % 3 === 1 ? 'apt-yildiz' : 'apt-yesilvadi');
      // Income
      try {
        await databases.createDocument(DATABASE_ID, 'incomes', `income-${i}`, {
          apartmentId: aptId,
          category: incomeCategories[i % incomeCategories.length],
          title: `${incomeCategories[i % incomeCategories.length]} - Ay ${i}`,
          amount: 1500.0 + i * 200,
          description: 'Aylık rutin gelir girdisi.',
          date: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (e) {}

      // Expense
      try {
        await databases.createDocument(DATABASE_ID, 'expenses', `expense-${i}`, {
          apartmentId: aptId,
          category: expenseCategories[i % expenseCategories.length],
          title: `${expenseCategories[i % expenseCategories.length]} Ödemesi`,
          amount: 800.0 + i * 150,
          description: 'Aylık rutin gider kalemi.',
          date: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (e) {}
    }

    // 8. Seed Notifications (40 notifications)
    console.log('Bildirimler oluşturuluyor...');
    for (let i = 1; i <= 40; i++) {
      const memberNum = (i % 46) + 1;
      const types = ['fee', 'announcement', 'maintenance', 'general'];
      const type = types[i % types.length];
      const msgs = {
        fee: 'Temmuz aidatınız yayınlandı. Lütfen zamanında ödeyin.',
        announcement: 'Yönetim tarafından yeni bir duyuru yayınlandı.',
        maintenance: 'Arıza bildiriminizin durumu güncellendi.',
        general: 'Profil bilgileriniz başarıyla güncellendi.'
      };
      try {
        await databases.createDocument(DATABASE_ID, 'notifications', `notification-${i}`, {
          userId: `member-${memberNum}`,
          title: `Sistem Bildirimi - ${i}`,
          message: msgs[type],
          isRead: i % 3 === 0,
          type: type,
          createdAt: new Date(Date.now() - i * 3 * 60 * 60 * 1000).toISOString()
        });
      } catch (e) {}
    }

    // 9. Seed Logs (20 logs)
    console.log('Loglar oluşturuluyor...');
    const logActions = ['user_login', 'fee_paid', 'announcement_created', 'request_created'];
    const logDetails = [
      'Kullanıcı sisteme başarılı bir şekilde giriş yaptı.',
      'Daire 5 aidat ödemesini gerçekleştirdi.',
      'Yönetici yeni bir duyuru paylaştı.',
      'Sakin yeni bir arıza talebi oluşturdu.'
    ];

    for (let i = 1; i <= 20; i++) {
      const memberNum = (i % 46) + 1;
      try {
        await databases.createDocument(DATABASE_ID, 'logs', `log-${i}`, {
          userId: `member-${memberNum}`,
          action: logActions[i % logActions.length],
          details: logDetails[i % logDetails.length],
          createdAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000).toISOString()
        });
      } catch (e) {}
    }

    console.log('\x1b[32mSeed İşlemi Başarıyla Tamamlandı!\x1b[0m');
    console.log('\x1b[35mArtık platform hazır. Keyifli çalışmalar!\x1b[0m');
  } catch (err) {
    console.error('Seed hatası:', err);
  }
}

async function createBlocksFloorsUnits(apartmentId, blocksCount, floorsCount, unitsPerFloor, startMemberIndex) {
  let memberIdx = startMemberIndex;
  const blockLetters = ['A', 'B', 'C', 'D'];

  for (let b = 0; b < blocksCount; b++) {
    const blockLetter = blockLetters[b];
    const blockId = `block-${apartmentId}-${blockLetter}`;
    
    // Create Block
    try {
      await databases.createDocument(DATABASE_ID, 'blocks', blockId, {
        apartmentId: apartmentId,
        name: `${blockLetter} Blok`
      });
    } catch (e) {}

    for (let f = 1; f <= floorsCount; f++) {
      const floorId = `floor-${apartmentId}-${blockLetter}-${f}`;
      
      // Create Floor
      try {
        await databases.createDocument(DATABASE_ID, 'floors', floorId, {
          apartmentId: apartmentId,
          blockId: blockId,
          number: f
        });
      } catch (e) {}

      for (let u = 1; u <= unitsPerFloor; u++) {
        const unitNum = (f - 1) * unitsPerFloor + u;
        const unitId = `unit-${apartmentId}-${blockLetter}-${f}-${unitNum}`;
        const memberId = `member-${(memberIdx % 46) + 1}`;
        memberIdx++;

        try {
          await databases.createDocument(DATABASE_ID, 'units', unitId, {
            apartmentId: apartmentId,
            blockId: blockId,
            floorId: floorId,
            number: unitNum.toString(),
            type: unitNum % 10 === 0 ? 'commercial' : 'residential',
            tenantId: unitNum % 2 === 0 ? memberId : undefined,
            ownerId: memberId,
            status: unitNum % 5 === 0 ? 'empty' : 'occupied'
          });
        } catch (e) {}
      }
    }
  }
}

setup();
