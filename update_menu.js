const fs = require('fs');

const items = [
    { cat: 'Entrées', name: 'EDAMAME', desc: 'salé ou harissa', price: 120 },
    { cat: 'Entrées', name: 'POULPE', desc: 'POULPE MARINÉ THAÏ GRILLÉ, ROQUETTE, TOMATE CONFITE', price: 180 },
    { cat: 'Entrées', name: 'CREVETTE ROCK N’ ROLL', desc: 'CREVETTE, SAUCE AU SRIRACHA, CITRON', price: 180 },
    { cat: 'Entrées', name: 'PASTÉQUE AU FETA', desc: 'FROMAGE FETA, OIGNONS, HUILE DE BASILIC, MENTHE', price: 160 },
    { cat: 'Entrées', name: 'CALAMARI', desc: 'BABY CALAMARI TEMPURA, SAUCE VERTE, MAYO ÉPICÉE, CITRON, PIMENT', price: 190 },
    { cat: 'Entrées', name: 'BURRATA', desc: 'TOMATE, OLIVES, AVOCAT, ROQUETTE, HUILE DE BASILIC, BALSAMIQUE', price: 180 },
    { cat: 'Entrées', name: 'MINI BRIOCHES CRABE', desc: 'CRABE, FROMAGE À LA CRÈME, MAYO, YUZU', price: 210 },

    { cat: 'Salades', name: 'NOMMOS', desc: 'Fromage de Chèvre, Noix, Figues, Sauce à l’Orange, Mesclun, Pomme, Mélasse de Grenade', price: 165 },
    { cat: 'Salades', name: 'Niçoise', desc: 'thon rouge cru et confit, salade, asperges, poivron mariné, œuf mollet, moutarde', price: 170 },
    { cat: 'Salades', name: 'POULET', desc: 'Poulet, sauce au sésame, coleslaw, croustillant japonais', price: 160 },
    { cat: 'Salades', name: 'GRECQUE', desc: 'Fromage Feta, Tomate, Oignons, Concombre, Câpres, Origan, Thym, Huile d’Olive', price: 160 },
    { cat: 'Salades', name: 'crabe', desc: 'AVOCAT ET CRABE ROYAL, PETIT BIJOU', price: 260 },
    { cat: 'Salades', name: 'HOMARD BLEU', desc: 'Demi-homard, mangue, fruit de la passion, asperge, avocat, argan', price: 720 },

    { cat: 'Le Cru', name: 'CARPACCIO DE BŒUF', desc: 'filet de bœuf, balsamique, moutarde, huile d’olive, parmesan, roquette', price: 180 },
    { cat: 'Le Cru', name: 'CEVICHE DE DORADE', desc: 'filet de dorade, yuzu, avocat, mangue', price: 180 },
    { cat: 'Le Cru', name: 'HUÎTRES', desc: 'Huîtres Oualidia, Vinaigre à l’échalote, Citron', price: 170 },
    { cat: 'Le Cru', name: 'tartare de thon rouge', desc: 'thon rouge, yuzu, citron, oignon, concombre, wasabi, coriandre', price: 210 },
    { cat: 'Le Cru', name: 'CEVICHE DE LANGOUSTINE', desc: 'Filet de langoustine, sauce yuzu, avocat, mangue', price: 320 },

    { cat: 'Plateau Royal', name: 'Small', desc: 'Langoustine, huîtres, gambas, moules, palourdes, crabe, thon rouge', price: 740 },
    { cat: 'Plateau Royal', name: 'King', desc: 'Homard, langoustine, palourdes, huîtres, dorade, gambas, moules', price: 1900 },

    { cat: 'Sushi', name: 'MEET SUSHI (4 pcs)', desc: 'Filet, riz Kagayaki, cream cheese, avocat, pomme de terre croustillante', price: 220 },
    { cat: 'Sushi', name: 'LOVE SUSHI', desc: 'Saumon, avocat, cream cheese', price: 210 },
    { cat: 'Sushi', name: 'AROMAKI SAUMON (8 pcs)', desc: 'Thon rouge, avocat, cream cheese, stick de crabe', price: 220 },
    { cat: 'Sushi', name: 'AROMAKI THON (8 pcs)', desc: 'Thon rouge, avocat, cream cheese, stick de crabe', price: 210 },
    { cat: 'Sushi', name: 'TIGER ROLL (8 pcs)', desc: 'Tempura crevette, cream cheese, avocat, soja, stick de crabe, sauce sweet chili', price: 220 },
    { cat: 'Sushi', name: 'THON ÉPICÉ (8 pcs)', desc: 'Thon rouge, avocat, cream cheese, stick de crabe, concombre', price: 220 },
    { cat: 'Sushi', name: 'FRIED DRAGON ROLL (8 pcs)', desc: 'Thon, saumon, wasabi, avocat, sriracha, surimi', price: 230 },
    { cat: 'Sushi', name: 'SAUMON ROLL (8 pcs)', desc: 'Saumon, avocat, mayo, yuzu, shiso', price: 210 },
    { cat: 'Sushi', name: 'ST-JACQUES ROLL', desc: 'Saint-Jacques, mangue, wakame, coco', price: 280 },
    { cat: 'Sushi', name: 'NOMMOS POKE BOWL', desc: 'Saumon, avocat, tiger, wakame, edamame, riz, stick de crabe, sauce ponzu', price: 290 },

    { cat: 'De la Mer', name: 'BAR', desc: 'Bar au miso', price: 290 },
    { cat: 'De la Mer', name: 'PAVÉ DE SAUMON', desc: 'SAUMON EN CROUTE DE SESAME TOMATE VIERGE', price: 280 },
    { cat: 'De la Mer', name: 'DORADE ROYALE', desc: 'Dorade, fromage au citron confit, harissa', price: 280 },
    { cat: 'De la Mer', name: 'GAMBAS MARINÉES', desc: 'Gambas marinées et grillées à la Thaï', price: 310 },
    { cat: 'De la Mer', name: 'SOLE DE PETIT BATEAU', desc: 'Sole, sauce du chef', price: 690 },
    { cat: 'De la Mer', name: 'HOMARD', desc: 'Homard grillé, huile épicée, thym, ail, sabayon', price: 1400 },

    { cat: 'Pâtes', name: 'SPAGHETTI ALLE VONGOLE', desc: 'Palourdes, ail, vin blanc, huile d’olive, herbes, parmesan', price: 220 },
    { cat: 'Pâtes', name: 'PENNE BURRATA', desc: 'Burrata, tomate, basilic, parmesan', price: 210 },
    { cat: 'Pâtes', name: 'TAGLIATELLE AUX GAMBAS', desc: 'Sauce harissa, gambas, parmesan', price: 260 },
    { cat: 'Pâtes', name: 'RISOTTO AUX GAMBAS', desc: 'Risotto, gambas, parmesan', price: 270 },
    { cat: 'Pâtes', name: 'RISOTTO ST JACQUES', desc: 'Saint-Jacques, risotto, parmesan', price: 290 },
    { cat: 'Pâtes', name: 'TAGLIATELLE SAUMON À LA TRUFFE', desc: 'Saumon, sauce truffe', price: 290 },
    { cat: 'Pâtes', name: 'RIGATONI AUX TRUFFES', desc: 'Crème de truffe, duxelles de champignons, truffe noire', price: 320 },
    { cat: 'Pâtes', name: 'LINGUINE AU HOMARD', desc: 'Linguine, sauce rosée, tomate cerise, basilic, parmesan, homard gratiné, sabayon', price: 820 },

    { cat: 'Robata', name: 'NOMMOS BURGER', desc: 'BŒUF, ÉCHALOTE CARAMÉLISÉE, BACON, CHEDDAR', price: 260 },
    { cat: 'Robata', name: 'SUPRÊME DE POULET', desc: 'Sauce foie gras, abricot, croûte cinq épices', price: 270 },
    { cat: 'Robata', name: 'BROCHETTES DE POULET GRILLÉ À LA GRECQUE', desc: 'Poulet mariné maison, pomme au four, salade verte', price: 280 },
    { cat: 'Robata', name: 'CŒUR DE VIANDE AU FROMAGE', desc: '', price: 280 },
    { cat: 'Robata', name: 'TOURNEDOS', desc: 'Filet 200g, sauce champignon, échalote confite', price: 290 },
    { cat: 'Robata', name: 'CÔTELETTES D’AGNEAU', desc: 'Côtes d’agneau 400g', price: 310 },
    { cat: 'Robata', name: 'DEMI POULET AU JASPER', desc: 'Demi poulet fermier, pomme, champignons, jus de volaille, morilles', price: 320 },
    { cat: 'Robata', name: 'ENTRECÔTE 400G', desc: 'Entrecôte au lait, moutarde', price: 340 },
    { cat: 'Robata', name: 'NOMMOS SPECIAL', desc: 'Filet de bœuf mariné à notre façon, cuit au beurre', price: 920 },
    { cat: 'Robata', name: 'BEEF RIBS', desc: 'Bœuf ribs à basse température', price: 810 },

    { cat: 'Viande Maturée', name: 'CôTE DE BŒUF 1,1kg', desc: 'VIANDE MATURÉE MAISON 45 JOURS', price: 970 },
    { cat: 'Viande Maturée', name: 'ENTRECôTE 400g', desc: 'VIANDE MATURÉE MAISON 45 JOURS', price: 490 },

    { cat: 'Premium Cuts', name: 'ENTRECÔTE 400G OR 24K', desc: 'COUVERT DE FEUILLES D’OR 24K', price: 1700 },
    { cat: 'Premium Cuts', name: 'CÔTE DE BOEUF 1,2 KG OR 24K', desc: 'COUVERT DE FEUILLES D’OR 24K', price: 2700 },
    { cat: 'Premium Cuts', name: 'AUSTRALIAN BLACK ANGUS ENTRECÔTE 400G', desc: '', price: 1400 },
    { cat: 'Premium Cuts', name: 'WAGYU ENTRECÔTE 400G AUSTRALIAN 7+', desc: '', price: 1900 },

    { cat: 'Accompagnements', name: 'POMMES FRITES', desc: '', price: 65 },
    { cat: 'Accompagnements', name: 'Légumes Sautés', desc: '', price: 65 },
    { cat: 'Accompagnements', name: 'PURÈE DE POMMES DE TERRE', desc: '', price: 70 },
    { cat: 'Accompagnements', name: 'ÉPINARDS', desc: '', price: 75 },
    { cat: 'Accompagnements', name: 'POMMES FRITES TRUFFE', desc: '', price: 95 },
    { cat: 'Accompagnements', name: 'CHAMPIGNONS SAUTÉS', desc: '', price: 75 },

    { cat: 'Sauces', name: 'JUS DE BŒUF', desc: '', price: 20 },
    { cat: 'Sauces', name: 'BÉARNAISE', desc: '', price: 20 },
    { cat: 'Sauces', name: 'CHAMPIGNON', desc: '', price: 20 },
    { cat: 'Sauces', name: 'Sauce chimichurri', desc: '', price: 20 },

    { cat: 'Desserts', name: 'Omelette Norvégienne', desc: 'Sorbet citron, sorbet fraise, biscuit joconde pistache, meringue italienne', price: 140 },
    { cat: 'Desserts', name: 'GRAIN DE CAFÉ', desc: 'Biscuit à la cuillère café, streusel amande, crème mascarpone, truffe chocolat amère', price: 160 },
    { cat: 'Desserts', name: 'MOELLEUX AU CHOCOLAT', desc: 'moelleux au chocolat , glace vanille', price: 170 },
    { cat: 'Desserts', name: 'TIRAMISU', desc: 'Mousse café non sucré, ganache café amère non sucré, caramel café vanillé, biscuits à la cuillère café', price: 160 },
    { cat: 'Desserts', name: 'Perle Coco', desc: 'Mousse noix de coco, insert mangue citron, biscuit dacquoise coco', price: 160 },
    { cat: 'Desserts', name: 'PARIS BREST', desc: 'Pâte à choux, mousse praliné noisette, crémeux chocolat, crème diplomate noisette, fruits secs torréfiés', price: 170 },
    { cat: 'Desserts', name: 'TARTE CITRON REVISITÉE', desc: 'Mousse légère citron, croustillant figues sèches et gingembre frais, pâte sucrée amandes, meringue suisse', price: 170 },
    { cat: 'Desserts', name: 'CHEESECAKE', desc: 'Mousse cheese citron, confit de fruits rouges, biscuit spéculoos, biscuit dacquoise amande', price: 160 },
    { cat: 'Desserts', name: 'PICASSO', desc: 'Choix de 3 desserts, servi avec le spectacle de Picasso', price: 320 },
    { cat: 'Desserts', name: 'ASSIETTE DE FRUITS', desc: '', price: 240 }
];

let finalMenu = [];
let idCounter = 1;
items.forEach(item => {
    finalMenu.push({
        id: idCounter++,
        cat: item.cat,
        name: item.name,
        desc: item.desc,
        ingredients: [],
        price: item.price,
        images: []
    });
});

let sharedJs = fs.readFileSync('C:\\Users\\Windows 10\\Desktop\\saad (2)\\foody-main\\shared.js', 'utf8');
const menuStart = sharedJs.indexOf('window.defaultMenu = [');
const menuEnd = sharedJs.indexOf('window.defaultCatEmojis = {');

const emojis = `
window.defaultCatEmojis = {
    'Entrées': '🍢',
    'Salades': '🥗',
    'Le Cru': '🍣',
    'Plateau Royal': '🦞',
    'Sushi': '🍱',
    'De la Mer': '🐟',
    'Pâtes': '🍝',
    'Robata': '🍗',
    'Viande Maturée': '🥩',
    'Premium Cuts': '🌟',
    'Accompagnements': '🍟',
    'Sauces': '🥫',
    'Desserts': '🍰'
};
`;

const superCats = `
window.defaultSuperCategories = [
    { id: 'entrees_salades', name: 'Entrées & Salades', emoji: '🥗', desc: 'Pour bien commencer', cats: ['Entrées', 'Salades'], time: 'Toute la journée' },
    { id: 'crus_sushis', name: 'Le Cru & Sushis', emoji: '🍣', desc: 'Plateaux Royaux et Sushis', cats: ['Le Cru', 'Plateau Royal', 'Sushi'], time: 'Toute la journée' },
    { id: 'mer_pates', name: 'De la Mer & Pâtes', emoji: '🍝', desc: 'Poissons et spécialités italiennes', cats: ['De la Mer', 'Pâtes'], time: 'Toute la journée' },
    { id: 'viandes_robata', name: 'Viandes & Robata', emoji: '🥩', desc: 'Viandes Maturées, Premium Cuts et grillades', cats: ['Robata', 'Viande Maturée', 'Premium Cuts'], time: 'Toute la journée' },
    { id: 'accompagnements', name: 'Accompagnements', emoji: '🍟', desc: 'Frites, légumes et sauces', cats: ['Accompagnements', 'Sauces'], time: 'Toute la journée' },
    { id: 'desserts', name: 'Desserts', emoji: '🍰', desc: 'Tiramisu, Cheesecake...', cats: ['Desserts'], time: 'Toute la journée' }
];

window.restaurantConfig =`;

const newMenuStr = 'window.defaultMenu = ' + JSON.stringify(finalMenu, null, 4) + ';\n\n';

let newSharedJs = sharedJs.substring(0, menuStart) + newMenuStr + emojis + superCats + sharedJs.substring(sharedJs.indexOf('window.restaurantConfig =') + 25);

fs.writeFileSync('C:\\Users\\Windows 10\\Desktop\\saad (2)\\foody-main\\shared.js', newSharedJs);
console.log("Done");
