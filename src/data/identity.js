import { pick } from '../engine/rng.js';

// peaux : indices dans SKINS (look.js) utilisés pour le perso aléatoire. Le joueur reste libre.
export const ORIGINES = {
  france: {
    nom: 'France', pays: ['France'], peaux: [0, 1, 2],
    h: ['Lucas', 'Hugo', 'Théo', 'Nathan', 'Louis', 'Maxime', 'Antoine', 'Tom', 'Enzo', 'Jules', 'Mathis', 'Baptiste'],
    f: ['Emma', 'Léa', 'Chloé', 'Manon', 'Camille', 'Jade', 'Louise', 'Clara', 'Zoé', 'Lola', 'Margaux', 'Pauline'],
    noms: ['Martin', 'Bernard', 'Dubois', 'Durand', 'Lefebvre', 'Moreau', 'Laurent', 'Girard', 'Roux', 'Fournier', 'Garnier', 'Chevalier'],
  },
  maghreb: {
    nom: 'Maghreb', pays: ['Algérie', 'Maroc', 'Tunisie'], peaux: [1, 2, 3, 4],
    h: ['Yanis', 'Karim', 'Mehdi', 'Rayan', 'Bilal', 'Sofiane', 'Nassim', 'Ilyes', 'Amine', 'Walid', 'Anis', 'Riad'],
    f: ['Inès', 'Sarah', 'Yasmine', 'Lina', 'Nour', 'Amira', 'Leïla', 'Myriam', 'Kenza', 'Imane', 'Salma', 'Rania'],
    noms: ['Benali', 'Haddad', 'Bouzid', 'Mansouri', 'Belkacem', 'Cherif', 'Amrani', 'Bensaïd', 'Khelifi', 'Ziani', 'Touati', 'El Idrissi'],
  },
  afrique_ouest: {
    nom: "Afrique de l'Ouest", pays: ['Sénégal', 'Mali', "Côte d'Ivoire", 'Guinée'], peaux: [5, 6, 7],
    h: ['Moussa', 'Mamadou', 'Ibrahima', 'Ousmane', 'Seydou', 'Abdoulaye', 'Cheikh', 'Issa', 'Lamine', 'Souleymane', 'Boubacar', 'Modibo'],
    f: ['Aminata', 'Fatou', 'Awa', 'Mariam', 'Aïssatou', 'Kadiatou', 'Binta', 'Coumba', 'Hawa', 'Oumou', 'Djeneba', 'Ndeye'],
    noms: ['Diallo', 'Traoré', 'Koné', 'Diop', 'Camara', 'Sow', 'Ndiaye', 'Cissé', 'Touré', 'Keïta', 'Sylla', 'Fofana'],
  },
  afrique_centrale: {
    nom: 'Afrique centrale', pays: ['Cameroun', 'Congo', 'RD Congo', 'Gabon'], peaux: [5, 6, 7],
    h: ['Junior', 'Christian', 'Serge', 'Patrick', 'Ange', 'Jordan', 'Yannick', 'Steve', 'Joël', 'Hervé', 'Arnaud', 'Cédric'],
    f: ['Grâce', 'Prisca', 'Merveille', 'Ornella', 'Divine', 'Laetitia', 'Carine', 'Sandra', 'Joëlle', 'Nadège', 'Christelle', 'Ruth'],
    noms: ['Ngoma', 'Mukendi', 'Essomba', 'Nkounkou', 'Etoundi', 'Mabika', 'Owona', 'Ilunga', 'Matondo', 'Mbida', 'Tshibanda', 'Ondoua'],
  },
  antilles: {
    nom: 'Antilles', pays: ['Guadeloupe', 'Martinique'], peaux: [4, 5, 6], francais: true,
    h: ['Kévin', 'Jérémy', 'Dylan', 'Ludovic', 'Teddy', 'Wilfried', 'Stéphane', 'Mickaël', 'Rudy', 'Johan', 'Florent', 'Loïc'],
    f: ['Mélissa', 'Océane', 'Laura', 'Cindy', 'Kelly', 'Maeva', 'Shana', 'Jessica', 'Lindsay', 'Audrey', 'Morgane', 'Sabrina'],
    noms: ['Jean-Baptiste', 'Romain', 'Lacroix', 'Bellance', 'Désir', 'Saint-Ange', 'Agathe', 'Hippolyte', 'Clairville', 'Marie-Sainte', 'Toussaint', 'Joseph'],
  },
  portugal: {
    nom: 'Portugal', pays: ['Portugal'], peaux: [1, 2, 3],
    h: ['Rafael', 'Diogo', 'Tiago', 'Rodrigo', 'João', 'Bruno', 'Ricardo', 'Miguel', 'Fábio', 'Nuno', 'Hugo', 'Daniel'],
    f: ['Beatriz', 'Inês', 'Mariana', 'Ana', 'Catarina', 'Sofia', 'Rita', 'Joana', 'Carolina', 'Daniela', 'Filipa', 'Marta'],
    noms: ['Da Silva', 'Pereira', 'Ferreira', 'Costa', 'Rodrigues', 'Martins', 'Gonçalves', 'Lopes', 'Mendes', 'Sousa', 'Teixeira', 'Carvalho'],
  },
  turquie: {
    nom: 'Turquie', pays: ['Turquie'], peaux: [1, 2, 3],
    h: ['Emre', 'Burak', 'Mehmet', 'Can', 'Kerem', 'Yusuf', 'Oğuz', 'Serkan', 'Hakan', 'Arda', 'Mert', 'Kaan'],
    f: ['Elif', 'Zeynep', 'Ayşe', 'Merve', 'Esra', 'Derya', 'Selin', 'Büşra', 'Melis', 'Ece', 'Hande', 'Dilara'],
    noms: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Öztürk', 'Aydın', 'Arslan', 'Doğan', 'Koç', 'Kurt', 'Polat'],
  },
  asie: {
    nom: 'Asie', pays: ['Vietnam', 'Chine', 'Cambodge'], peaux: [0, 1, 2],
    h: ['Minh', 'Kevin', 'Thomas', 'Wei', 'Long', 'David', 'Anh', 'Hao', 'Jun', 'Bao', 'Vincent', 'Kim'],
    f: ['Linh', 'Mei', 'Lan', 'Julie', 'Mai', 'Xin', 'Thu', 'Hoa', 'Lily', 'Ngoc', 'Sophie', 'Yen'],
    noms: ['Nguyen', 'Tran', 'Le', 'Pham', 'Chen', 'Wang', 'Li', 'Zhang', 'Vo', 'Huynh', 'Lam', 'Truong'],
  },
  europe_est: {
    nom: "Europe de l'Est", pays: ['Roumanie', 'Pologne', 'Ukraine'], peaux: [0, 1],
    h: ['Andrei', 'Mihai', 'Piotr', 'Dmytro', 'Vlad', 'Bogdan', 'Pavel', 'Oleksandr', 'Marek', 'Stefan', 'Igor', 'Tomasz'],
    f: ['Ioana', 'Anna', 'Olena', 'Natalia', 'Maria', 'Elena', 'Kasia', 'Irina', 'Daria', 'Oksana', 'Alina', 'Zofia'],
    noms: ['Popescu', 'Ionescu', 'Kowalski', 'Nowak', 'Shevchenko', 'Kovalenko', 'Dumitru', 'Wiśniewski', 'Bondarenko', 'Stan', 'Lewandowski', 'Moroz'],
  },
  amerique_latine: {
    nom: 'Amérique latine', pays: ['Colombie', 'Brésil', 'Pérou'], peaux: [1, 2, 3, 4, 5],
    h: ['Mateo', 'Santiago', 'Diego', 'Alejandro', 'Gabriel', 'Andrés', 'Felipe', 'Thiago', 'Juan', 'Carlos', 'Luis', 'Pablo'],
    f: ['Valentina', 'Camila', 'Isabella', 'Lucía', 'Mariana', 'Gabriela', 'Daniela', 'Sofía', 'Paula', 'Luana', 'Ana', 'Juliana'],
    noms: ['García', 'Rodríguez', 'Gómez', 'Silva', 'Santos', 'Oliveira', 'Pérez', 'López', 'Martínez', 'Torres', 'Ramírez', 'Souza'],
  },
};

export const VILLES = ['Marseille', 'Paris', 'Lyon', 'Lille', 'Toulouse', 'Nice', 'Bordeaux', 'Nantes', 'Strasbourg', 'Montpellier'];
export const COTIERES = ['Marseille', 'Nice', 'Montpellier'];

export const MILIEUX = {
  precaire: { nom: 'Précaire', logement: 'hlm', poche: 0, heritage: 0 },
  modeste: { nom: 'Modeste', logement: 'hlm', poche: 250, heritage: 4000 },
  moyenne: { nom: 'Classe moyenne', logement: 'appart', poche: 600, heritage: 40000 },
  aisee: { nom: 'Aisée', logement: 'maison', poche: 1500, heritage: 180000 },
  riche: { nom: 'Riche', logement: 'villa', poche: 6000, heritage: 1500000 },
};

export const STATUTS = {
  ne_france: ['Né en France', 'Née en France'],
  titre: ['Titre de séjour', 'Titre de séjour'],
  sans_papiers: ['Sans-papiers', 'Sans-papiers'],
  naturalise: ['Naturalisé', 'Naturalisée'],
  au_pays: ['Au pays', 'Au pays'],
};

export const TRAITS = {
  impulsif: { nom: 'Impulsif', f: 'Impulsive', desc: 'Fonce sans réfléchir' },
  calme: { nom: 'Calme', f: 'Calme', desc: 'Sang-froid sous pression' },
  ambitieux: { nom: 'Ambitieux', f: 'Ambitieuse', desc: 'Monte plus vite' },
  charismatique: { nom: 'Charismatique', f: 'Charismatique', desc: 'Convainc tout le monde' },
  malin: { nom: 'Malin', f: 'Maligne', desc: 'Toujours un coup d’avance' },
  genereux: { nom: 'Généreux', f: 'Généreuse', desc: 'Le cœur sur la main' },
  loyal: { nom: 'Loyal', f: 'Loyale', desc: 'Ne lâche jamais les siens' },
  mefiant: { nom: 'Méfiant', f: 'Méfiante', desc: 'Sent les pièges' },
  flemmard: { nom: 'Flemmard', f: 'Flemmarde', desc: 'Économise son énergie' },
  courageux: { nom: 'Courageux', f: 'Courageuse', desc: 'N’a peur de rien' },
};

export const TALENTS = {
  football: 'Football', basket: 'Basket', boxe: 'Boxe', musique: 'Musique / rap',
  dessin: 'Dessin / street-art', comedie: 'Comédie', tech: 'Informatique', business: 'Business', aucun: 'Aucun',
};

export const nameFor = (origine, genre) => pick((ORIGINES[origine] || ORIGINES.france)[genre === 'f' ? 'f' : 'h']);
export const surnameFor = (origine) => pick((ORIGINES[origine] || ORIGINES.france).noms);
