/**
 * BAUM Festival 11 - Configuration & Festival Data
 * Contiene todas las constantes, configuraciones y datos del festival
 */

export const STAGES_LIST = [
  { name:'Stamm',           color:'#FF1E78', desc:'Main floor · Techno' },
  { name:'BAUM',            color:'#7B4FFF', desc:'Sala oscura · House & Techno' },
  { name:'Páramo',          color:'#00C9A7', desc:'Inmersivo · Intercell' },
  { name:'Resident Advisor',color:'#FF8C00', desc:'Curaduría RA' },
  { name:'Todalanoche',     color:'#E040FB', desc:'All night · Unreal' }
];

export const LINEUP = [
  /* VIERNES 22 DE MAYO */
  {id:1, name:'YoungLolo',                 stage:'Páramo',          start:'15:30', end:'16:30', tags:['electro']},
  {id:2, name:'MJ',                        stage:'BAUM',            start:'16:00', end:'17:00', tags:['house']},
  {id:3, name:'DJ Cringey',                stage:'Páramo',          start:'16:30', end:'18:00', tags:['electro']},
  {id:4, name:'Aleja Vargas',              stage:'BAUM',            start:'17:00', end:'18:00', tags:['techno']},
  {id:5, name:'Loumie',                    stage:'Resident Advisor',start:'17:00', end:'18:00', tags:['house']},
  {id:6, name:'Praxys',                    stage:'Todalanoche',     start:'17:00', end:'18:00', tags:['live'], extra:'LIVE'},
  {id:7, name:'Julián Gómez',              stage:'Stamm',           start:'17:30', end:'18:30', tags:['techno']},
  {id:8, name:'Alba Franch B2B H. Lawert', stage:'Páramo',          start:'18:00', end:'19:30', tags:['B2B','techno']},
  {id:9, name:'Dollhouse',                 stage:'BAUM',            start:'18:00', end:'19:30', tags:['house']},
  {id:10,name:'Lovefoxy',                  stage:'Resident Advisor',start:'18:00', end:'19:30', tags:['dance']},
  {id:11,name:'Johannes Schuster',         stage:'Todalanoche',     start:'18:00', end:'19:30', tags:['techno']},
  {id:12,name:'Pablo Romero',              stage:'Stamm',           start:'18:30', end:'20:00', tags:['minimal','techno']},
  {id:13,name:'Barbara Lago',              stage:'BAUM',            start:'19:30', end:'21:00', tags:['techno']},
  {id:14,name:'Emilija',                   stage:'Páramo',          start:'19:30', end:'21:00', tags:['electrónica']},
  {id:15,name:'ISAbella',                  stage:'Resident Advisor',start:'19:30', end:'21:00', tags:['techno']},
  {id:16,name:'BIIA',                      stage:'Todalanoche',     start:'19:30', end:'21:00', tags:['techno']},
  {id:17,name:'Cassian',                   stage:'Stamm',           start:'20:00', end:'21:30', tags:['dance','house']},
  {id:18,name:'Noise Mafia',               stage:'BAUM',            start:'21:00', end:'22:30', tags:['techno']},
  {id:19,name:'Supergloss',                stage:'Páramo',          start:'21:00', end:'22:30', tags:['techno']},
  {id:20,name:'Adiel B2B Quest',           stage:'Resident Advisor',start:'21:00', end:'22:30', tags:['B2B','techno']},
  {id:21,name:'Cera Khin',                 stage:'Todalanoche',     start:'21:00', end:'22:30', tags:['techno']},
  {id:22,name:'Disclosure',               stage:'Stamm',           start:'21:30', end:'23:00', tags:['DJ SET','house'], extra:'DJ SET'},
  {id:23,name:'Pawlowski',                 stage:'BAUM',            start:'22:30', end:'00:00', tags:['techno']},
  {id:24,name:'Malugi',                    stage:'Páramo',          start:'22:30', end:'00:00', tags:['techno']},
  {id:25,name:'Estella Boersma',           stage:'Resident Advisor',start:'22:30', end:'00:00', tags:['techno']},
  {id:26,name:'KUKO',                      stage:'Todalanoche',     start:'22:30', end:'00:00', tags:['techno']},
  {id:27,name:'Joseph Capriati',           stage:'Stamm',           start:'23:00', end:'01:00', tags:['techno','rave']},
  {id:28,name:'Novah',                     stage:'BAUM',            start:'00:00', end:'01:30', tags:['techno']},
  {id:29,name:'ØTTA',                      stage:'Páramo',          start:'00:00', end:'01:30', tags:['techno']},
  {id:30,name:'Boys Noize',                stage:'Resident Advisor',start:'00:00', end:'01:30', tags:['electro','techno']},
  {id:31,name:'LESSSS',                    stage:'Todalanoche',     start:'00:00', end:'01:30', tags:['techno']},
  {id:32,name:'Richie Hawtin',             stage:'Stamm',           start:'01:00', end:'03:00', tags:['techno','LEGEND']},
  {id:33,name:'6EJOU B2B SNTS',            stage:'BAUM',            start:'01:30', end:'03:00', tags:['B2B','techno']},
  {id:34,name:'Pegassi',                   stage:'Páramo',          start:'01:30', end:'03:00', tags:['techno']},
  {id:35,name:'Helena Hauff',              stage:'Resident Advisor',start:'01:30', end:'03:00', tags:['electro','techno']},
  {id:36,name:'Onlynumbers',               stage:'Todalanoche',     start:'01:30', end:'03:00', tags:['techno']}
];

export const LINEUP_DAY23 = [
  /* SÁBADO 23 DE MAYO */
  {id:101,name:'SAI NORO$T',                stage:'Todalanoche',     start:'15:00', end:'16:30', tags:['techno']},
  {id:102,name:'Felinah',                   stage:'BAUM',            start:'16:00', end:'17:30', tags:['techno']},
  {id:103,name:'Nyksan',                    stage:'Páramo',          start:'16:00', end:'17:00', tags:['house']},
  {id:104,name:'EV-1',                      stage:'Resident Advisor',start:'16:00', end:'17:00', tags:['electro']},
  {id:105,name:'Oslo DJ Kinner',            stage:'Todalanoche',     start:'16:30', end:'18:00', tags:['techno']},
  {id:106,name:'Emilio Mustafa',            stage:'Stamm',           start:'17:00', end:'18:30', tags:['techno']},
  {id:107,name:'Brenda',                    stage:'Páramo',          start:'17:00', end:'18:00', tags:['house']},
  {id:108,name:'Thelma',                    stage:'Resident Advisor',start:'17:00', end:'18:15', tags:['electro']},
  {id:109,name:'Sguiz B2B No One',          stage:'BAUM',            start:'17:30', end:'19:30', tags:['B2B','techno']},
  {id:110,name:'Nick León',                 stage:'Páramo',          start:'18:00', end:'19:30', tags:['techno']},
  {id:111,name:'Florian Picasso B2B A. Nantaya', stage:'Todalanoche', start:'18:00', end:'19:30', tags:['B2B','techno']},
  {id:112,name:'Philippa Pacho',            stage:'Resident Advisor',start:'18:15', end:'19:45', tags:['electro']},
  {id:113,name:'Nicola Cruz',               stage:'Páramo',          start:'19:30', end:'21:00', tags:['techno']},
  {id:114,name:'Uberkikz B2B Felicie',      stage:'Resident Advisor',start:'19:45', end:'21:15', tags:['B2B','techno']},
  {id:115,name:'Mija B2B Ollie Lishman',    stage:'Todalanoche',     start:'19:30', end:'21:00', tags:['B2B','techno']},
  {id:116,name:'Shoki287',                  stage:'BAUM',            start:'19:30', end:'21:00', tags:['techno']},
  {id:117,name:'ANNÉ B2B SHDW',             stage:'Resident Advisor',start:'21:15', end:'22:45', tags:['B2B','electro']},
  {id:118,name:'Avalon Emerson',            stage:'Páramo',          start:'21:00', end:'22:30', tags:['techno']},
  {id:119,name:'Davyboi B2B Parfait',       stage:'Todalanoche',     start:'21:00', end:'22:30', tags:['B2B','techno']},
  {id:120,name:'Fenrick',                   stage:'BAUM',            start:'21:00', end:'22:30', tags:['techno']},
  {id:121,name:'Elderbrook',                stage:'Stamm',           start:'20:00', end:'21:30', tags:['DJ SET','house'], extra:'DJ SET'},
  {id:122,name:'PAN-POT',                   stage:'Stamm',           start:'21:30', end:'23:00', tags:['techno']},
  {id:123,name:'Serafina',                  stage:'BAUM',            start:'22:30', end:'00:00', tags:['techno']},
  {id:124,name:'Alarico B2B Yamamaste',     stage:'Páramo',          start:'22:45', end:'00:15', tags:['B2B','electro']},
  {id:125,name:'KUKO B2B J. Schuster',      stage:'Todalanoche',     start:'22:30', end:'00:00', tags:['B2B','techno']},
  {id:126,name:'Underworld',                stage:'Stamm',           start:'23:25', end:'00:55', tags:['live'], extra:'LIVE'},
  {id:127,name:'Andres Campo',              stage:'BAUM',            start:'00:00', end:'01:30', tags:['techno']},
  {id:128,name:'Agoria',                    stage:'Páramo',          start:'00:00', end:'01:30', tags:['techno']},
  {id:129,name:'DJ Rush',                   stage:'Resident Advisor',start:'00:15', end:'01:45', tags:['techno']},
  {id:130,name:'Franck B2B Fenrick',        stage:'Todalanoche',     start:'00:00', end:'01:30', tags:['B2B','techno']},
  {id:131,name:'Nina Kraviz',               stage:'Stamm',           start:'01:10', end:'03:00', tags:['techno','LEGEND']},
  {id:132,name:'Vini Vici',                 stage:'BAUM',            start:'01:30', end:'03:00', tags:['techno']},
  {id:133,name:'Paul Oakenfeld',            stage:'Páramo',          start:'01:30', end:'03:00', tags:['techno']},
  {id:134,name:'Planetary Assault Systems', stage:'Resident Advisor',start:'01:45', end:'03:00', tags:['electro','live'], extra:'LIVE'},
  {id:135,name:'Adrian Mills B2B Serafina',stage:'Todalanoche',     start:'01:30', end:'03:00', tags:['B2B','techno']}
];
