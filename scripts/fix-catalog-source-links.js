const fs = require('fs');
const path = 'js/data.js';
let s = fs.readFileSync(path, 'utf8');

const radoAnchor = '    hoverImage: "https://www.rado.com/media/sgecom_contentsystem/PDP_Images/true-square-black-carousel-a.jpg?im=Resize%3D%281024%2C682%29%2Caspect%3Dfill%3BCrop%3D%280%2C0%2C1024%2C682%29%2Cgravity%3DCenter",\n    amplitude:';
const radoReplacement = '    hoverImage: "https://www.rado.com/media/sgecom_contentsystem/PDP_Images/true-square-black-carousel-a.jpg?im=Resize%3D%281024%2C682%29%2Caspect%3Dfill%3BCrop%3D%280%2C0%2C1024%2C682%29%2Cgravity%3DCenter",\n    sourceUrl: "https://www.rado.com/true-square-automatic-open-heart-r27086162.html",\n    amplitude:';
if (!s.includes(radoAnchor)) throw new Error('Rado 108 anchor not found');
s = s.replace(radoAnchor, radoReplacement);

const wrong = '    sourceUrl: "https://www.rado.com/true-square-automatic-open-heart-r27086162.html",\n    hallmark: "Au750 • Cartier 18 • Seri No Lazerli",';
const correct = '    sourceUrl: "https://www.cartier.com/en-tr/jewellery/bracelets/juste-un-clou/juste-un-clou-bracelet-classic-model-diamonds-CRB6048617.html",\n    hallmark: "Au750 • Cartier 18 • Seri No Lazerli",';
if (!s.includes(wrong)) throw new Error('Cartier id1 wrong-source anchor not found');
s = s.replace(wrong, correct);

fs.writeFileSync(path, s, 'utf8');
console.log('Catalog source-link boundary corrected.');
