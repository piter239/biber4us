/* Aufgabe Wie viele Farben? (Biber 2018, Seite 61): Färbeproblem; ausprobieren durch Ausmalen, Antwort ist eine Zahl */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-wievielefarben18';
  var RIGHT = 3;   /* laut Heft; per Skript bestätigt (Graph aus dem Bild: 19 Flächen, 34 Nachbarschaften, 3 Farben nötig und genügend) */

  /* Flächen: id (2..20) -> Pfad, Beschriftungsposition. Aus der Zeichnung im Heft ermittelt. */
  var BOARD = {"regions":{"2":{"d":"M1.32 1.16 L1.14 1.52 L1.14 154.34 L1.32 154.7 L1.86 154.88 L2.4 154.7 L2.58 154.34 L2.76 152.18 L4.38 143.36 L6 136.34 L8.7 126.8 L11.58 118.34 L15.72 108.08 L21.48 96.2 L24.9 90.08 L32.46 78.2 L36.78 72.26 L37.5 71.72 L40.2 74.42 L48.12 83.78 L70.8 112.04 L70.98 112.58 L90.6 137.24 L123.72 179.72 L123.36 180.62 L38.4 288.98 L38.58 290.24 L43.8 296.72 L50.1 303.74 L57.12 310.76 L62.88 315.98 L72.42 323.72 L72.96 323.9 L73.68 323.72 L158.1 204.74 L158.28 204.92 L158.28 307.88 L158.46 308.24 L163.32 309.14 L170.16 309.86 L176.46 310.04 L176.64 310.22 L184.56 310.22 L184.74 310.04 L188.52 310.04 L197.88 309.14 L205.98 307.7 L206.16 307.34 L206.16 204.92 L206.34 204.74 L260.88 281.6 L261.42 281.78 L262.14 281.6 L268.98 275.66 L276 268.64 L281.04 262.88 L286.44 255.86 L291.12 248.84 L292.38 246.68 L292.38 245.96 L242.52 180.62 L242.52 180.26 L292.2 114.92 L292.2 114.02 L290.4 110.96 L285.36 103.58 L280.14 96.92 L276.18 92.42 L268.62 84.86 L262.14 79.28 L261.24 78.92 L260.52 79.1 L206.34 157.04 L206.16 156.86 L206.16 3.14 L205.98 2.78 L196.08 1.52 L187.8 1.16 L187.62 0.98 L169.8 1.16 L169.62 1.34 L167.1 1.34 L159.9 2.06 L158.28 2.42 L158.1 2.78 L158.1 156.86 L157.92 157.04 L73.32 35.9 L80.34 30.86 L90.06 24.74 L96.54 21.14 L108.42 15.38 L116.7 11.96 L127.14 8.36 L139.74 4.94 L149.46 2.96 L154.32 2.24 L154.5 1.88 L154.32 1.16 L153.78 0.98 L1.86 0.98ZM177.72 168.2 L182.58 168.02 L185.28 168.74 L187.26 169.82 L188.7 170.9 L190.86 173.24 L192.12 175.4 L192.84 177.56 L193.02 182.24 L192.3 184.94 L191.4 186.74 L190.5 188 L188.16 190.34 L186.54 191.42 L184.56 192.32 L181.86 192.86 L179.34 192.86 L177.36 192.5 L174.48 191.24 L172.32 189.62 L170.52 187.64 L168.72 184.04 L168.18 181.34 L168.18 179.54 L168.54 177.38 L169.98 173.96 L170.88 172.7 L173.58 170.18 L176.1 168.74Z","cx":36.6,"cy":36.4},"3":{"d":"M206.88 1.16 L206.7 1.88 L206.88 2.24 L213.36 3.32 L222 5.12 L229.02 6.92 L238.38 9.8 L245.76 12.5 L253.5 15.74 L265.92 21.86 L278.34 29.24 L289.68 37.16 L300.12 45.8 L311.1 56.42 L315.42 61.1 L321.36 68.12 L329.64 79.28 L336.66 90.44 L343.5 103.4 L348.54 115.1 L352.68 126.98 L356.1 139.58 L357.72 147.32 L358.8 154.52 L358.98 154.88 L359.52 155.06 L360.06 154.88 L360.24 154.52 L360.24 1.52 L360.06 1.16 L359.52 0.98 L207.42 0.98Z","cx":329.6,"cy":31.6},"4":{"d":"M157.38 2.6 L156.48 2.42 L148.56 3.68 L134.88 6.74 L126.24 9.26 L115.08 13.22 L105.72 17.18 L94.92 22.58 L84.48 28.7 L74.58 35.54 L74.4 36.44 L75.12 37.7 L101.76 75.68 L102.3 75.86 L103.2 75.5 L111.12 69.92 L118.14 65.78 L125.16 62.18 L130.38 59.84 L136.86 57.32 L144.06 54.98 L152.52 52.82 L157.38 51.92 L157.56 51.56 L157.56 2.96Z","cx":112.6,"cy":41.1},"5":{"d":"M206.88 3.14 L206.7 3.5 L206.7 52.1 L206.88 52.46 L213.36 53.9 L219.66 55.7 L226.86 58.22 L234.6 61.46 L239.1 63.62 L246.66 67.76 L253.5 72.08 L259.8 76.76 L260.7 77.12 L261.24 76.94 L288.42 37.88 L288.24 36.8 L285 34.28 L277.26 29.06 L267.9 23.48 L258.9 18.8 L247.92 13.94 L241.26 11.42 L226.86 6.92 L215.16 4.22 L207.78 2.96Z","cx":235.3,"cy":35.4},"6":{"d":"M289.32 37.88 L288.6 38.24 L261.6 77.12 L261.42 78.02 L262.14 78.92 L268.98 84.68 L277.98 93.86 L282.12 98.72 L286.26 104.12 L290.58 110.42 L292.02 112.94 L292.92 113.3 L293.82 112.76 L323.7 73.52 L324.06 72.44 L322.26 69.92 L316.14 62.54 L310.38 56.24 L304.8 50.66 L294.9 41.84 L290.4 38.24Z","cx":293.3,"cy":73.7},"7":{"d":"M156.12 52.64 L151.08 53.72 L142.44 56.06 L133.62 59.12 L127.14 61.82 L117.78 66.5 L111.66 70.1 L103.2 75.86 L102.66 76.58 L102.66 77.12 L155.94 153.62 L156.84 154.16 L157.38 153.98 L157.56 153.62 L157.56 53.18 L157.38 52.82Z","cx":134.9,"cy":83.4},"8":{"d":"M207.78 53.18 L206.88 53.36 L206.7 53.72 L206.7 153.62 L206.88 153.98 L207.42 154.16 L208.32 153.62 L260.34 78.74 L260.34 77.84 L259.8 77.12 L251.34 71.18 L242.52 65.96 L234.96 62.18 L227.22 58.94 L220.02 56.42 L213.18 54.44Z","cx":229.0,"cy":84.3},"9":{"d":"M37.5 72.62 L36.96 72.8 L28.86 84.5 L25.26 90.44 L21.12 98 L14.82 111.5 L12.12 118.34 L9.06 127.34 L5.64 139.94 L4.56 145.88 L4.2 146.78 L2.76 155.6 L1.68 165.32 L1.5 170.54 L1.32 170.72 L1.14 185.66 L1.32 185.84 L1.32 190.16 L1.5 190.34 L2.04 199.52 L4.02 213.2 L6.72 225.44 L8.52 231.92 L11.22 240.2 L15.9 252.08 L22.56 265.76 L29.58 277.64 L37.14 288.44 L37.68 288.62 L38.22 288.44 L39.66 286.82 L69.36 248.84 L69 247.58 L67.56 245.42 L64.32 239.48 L60.18 230.48 L58.02 224.9 L54.78 214.64 L52.26 203.48 L51.18 196.28 L50.64 190.88 L50.64 188.54 L50.46 188.36 L50.46 184.76 L50.28 184.58 L50.28 176.3 L50.46 176.12 L50.82 168.02 L51.72 160.64 L53.34 152 L55.68 143 L58.74 134 L61.98 126.26 L65.76 118.7 L69.36 112.76 L69.72 111.5 L47.76 83.96 L39.84 74.6 L38.04 72.8Z","cx":26.3,"cy":194.3},"10":{"d":"M324.6 73.52 L323.52 74.24 L293.28 114.2 L293.28 114.92 L297.24 121.94 L301.02 130.22 L303.72 137.24 L305.7 143.36 L307.86 151.64 L309.12 157.94 L310.2 165.32 L310.56 170.9 L310.74 171.08 L310.74 173.78 L310.92 173.96 L310.92 186.92 L310.74 187.1 L310.56 192.14 L309.3 202.04 L307.68 210.14 L304.8 220.58 L302.1 228.14 L298.68 236.06 L295.08 243.08 L294 244.7 L293.28 246.5 L324.06 286.82 L324.78 287 L325.32 286.82 L331.08 278.54 L335.22 271.88 L339.36 264.5 L343.14 256.94 L346.2 250.1 L349.26 242.36 L352.14 233.9 L355.74 220.58 L358.26 207.26 L359.7 194.48 L360.24 179.72 L360.06 179.54 L360.06 172.16 L359.88 171.98 L359.52 164.24 L357.54 149.12 L356.28 142.64 L354.12 133.64 L350.16 120.86 L347.1 112.76 L344.22 106.1 L338.46 94.58 L331.98 83.6 L325.14 73.7Z","cx":322.1,"cy":117.1},"11":{"d":"M70.26 112.76 L69.54 113.12 L68.64 114.56 L62.34 126.62 L59.1 134.36 L56.22 142.82 L54.06 150.92 L52.8 157.04 L51.54 165.68 L51.18 171.62 L51 171.8 L51 175.04 L50.82 175.22 L50.82 185.66 L51 185.84 L51 189.08 L51.18 189.26 L51.54 195.2 L52.98 204.74 L54.96 213.56 L58.38 224.54 L61.62 232.64 L66.66 242.9 L69.18 247.22 L69.72 247.4 L70.44 247.22 L123 180.26 L122.82 179.18 L71.34 113.48Z","cx":82.7,"cy":179.9},"12":{"d":"M292.56 115.64 L291.84 116 L246.66 175.4 L243.42 179.72 L243.24 180.8 L292.02 244.88 L292.74 245.24 L293.64 244.7 L299.94 232.1 L302.82 224.9 L305.88 215.36 L307.5 208.88 L309.48 197.54 L310.2 190.52 L310.2 187.82 L310.38 187.64 L310.56 178.28 L310.38 178.1 L310.2 170.36 L309.12 160.82 L307.14 150.56 L305.16 143.18 L302.1 134.18 L298.86 126.44 L293.82 116.54 L293.28 115.82Z","cx":280.7,"cy":180.4},"13":{"d":"M178.8 168.56 L175.74 169.46 L174.3 170.18 L171.24 172.88 L169.08 177.2 L168.72 179 L168.72 181.88 L169.26 184.22 L170.34 186.56 L171.78 188.54 L173.4 189.98 L175.92 191.42 L179.34 192.32 L182.04 192.32 L184.38 191.78 L186.54 190.88 L188.16 189.8 L190.14 187.82 L191.94 184.58 L192.48 182.6 L192.66 181.16 L192.48 178.28 L191.76 175.76 L191.04 174.32 L189.78 172.52 L187.8 170.72 L186 169.64 L183.48 168.74Z","cx":180.6,"cy":180.4},"14":{"d":"M360.06 206 L359.52 205.82 L358.98 206 L358.8 206.36 L357.9 212.48 L356.28 220.4 L354.48 227.6 L352.14 235.52 L348.9 244.7 L343.68 256.94 L339.9 264.5 L336.48 270.62 L328.56 283.04 L324.78 288.26 L323.52 289.52 L320.28 293.84 L311.28 304.1 L299.76 315.26 L288.78 324.26 L277.98 331.82 L271.86 335.6 L264.48 339.74 L251.34 346.04 L239.28 350.72 L231.36 353.24 L222.54 355.58 L214.08 357.38 L207.78 358.28 L206.88 358.64 L206.7 359 L206.88 359.72 L207.42 359.9 L359.52 359.9 L360.06 359.72 L360.24 359.36 L360.24 206.36Z","cx":329.6,"cy":329.3},"15":{"d":"M1.32 206.18 L1.14 206.54 L1.14 359.36 L1.32 359.72 L1.86 359.9 L154.14 359.9 L154.68 359.72 L154.86 359 L154.68 358.64 L148.74 357.74 L139.2 355.76 L132.18 353.96 L123.9 351.44 L110.58 346.4 L102.66 342.8 L95.64 339.2 L84.3 332.54 L78.36 328.58 L71.7 323.72 L65.22 318.5 L59.46 313.46 L49.92 304.1 L40.74 293.66 L33.18 283.76 L28.14 276.2 L24.54 270.26 L18.42 258.74 L13.92 248.66 L9.6 236.96 L7.08 228.68 L5.46 222.38 L3.66 213.92 L2.58 206.54 L2.4 206.18 L1.86 206Z","cx":31.7,"cy":329.3},"16":{"d":"M157.02 207.62 L156.3 207.98 L102.66 283.76 L102.66 284.3 L103.02 284.84 L110.58 290.06 L116.88 293.84 L126.06 298.52 L133.26 301.58 L142.62 304.82 L151.26 307.16 L156.48 308.24 L157.56 307.88 L157.74 307.52 L157.74 208.16 L157.56 207.8Z","cx":135.1,"cy":277.5},"17":{"d":"M207.42 207.62 L206.88 207.8 L206.7 208.16 L206.7 357.2 L206.88 357.56 L208.32 357.74 L219.84 355.58 L232.26 352.34 L242.52 348.92 L253.68 344.42 L263.76 339.56 L274.56 333.44 L282.3 328.4 L288.78 323.72 L289.32 323 L289.32 322.28 L208.32 208.16Z","cx":240.7,"cy":312.7},"18":{"d":"M292.92 247.4 L292.2 247.76 L286.44 256.58 L279.42 265.4 L276.18 269 L269.34 275.84 L262.14 281.96 L261.78 282.5 L262.32 283.76 L289.5 321.92 L290.22 322.28 L291.84 321.38 L299.58 314.9 L303.72 311.12 L311.1 303.74 L319.92 293.66 L324.06 288.08 L323.7 287 L294.18 248.3 L293.46 247.58Z","cx":293.8,"cy":287.0},"19":{"d":"M101.58 285.02 L74.04 323.9 L74.22 324.98 L84.12 331.82 L93.84 337.58 L105.18 343.34 L114.9 347.48 L126.6 351.62 L134.7 353.96 L149.28 357.2 L156.3 358.28 L157.2 358.1 L157.38 357.74 L157.38 309.32 L157.2 308.96 L148.92 307.16 L142.44 305.36 L136.5 303.38 L128.4 300.14 L117.24 294.56 L110.04 290.24 L103.02 285.2 L102.12 284.84Z","cx":126.6,"cy":325.7},"20":{"d":"M205.98 308.6 L204.72 308.42 L200.4 309.32 L192.84 310.22 L188.34 310.4 L188.16 310.58 L184.2 310.58 L184.02 310.76 L173.04 310.58 L172.86 310.4 L170.34 310.4 L163.32 309.68 L159.54 308.96 L158.1 309.14 L157.92 309.5 L157.92 357.92 L158.28 358.46 L163.5 359.18 L170.34 359.54 L170.52 359.72 L186.54 359.9 L186.72 359.72 L190.5 359.72 L190.68 359.54 L199.32 359 L205.26 358.28 L205.98 357.92 L206.16 357.56 L206.16 308.96Z","cx":182.0,"cy":334.9}},"adj":[[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,11],[2,12],[2,13],[2,15],[2,16],[2,17],[2,18],[2,19],[2,20],[3,5],[3,6],[3,10],[4,7],[5,6],[5,8],[6,10],[9,11],[9,15],[10,12],[10,14],[10,18],[14,17],[14,18],[15,19],[16,19],[17,18],[17,20],[19,20]],"outline":"M 206.38 0.89 L 206.38 2.99 C 197.91 1.66 189.13 0.89 180.26 0.89 Z M 206.38 0.89 M 242.65 180.47 L 292.71 114.57 C 284.4 100.52 273.62 88.15 260.75 78.06 L 206.33 156.23 L 206.33 2.77 C 197.92 1.58 189.22 0.89 180.41 0.89 C 172.6 0.89 164.97 1.38 157.46 2.37 L 157.46 156.23 L 101.95 76.68 L 73.65 36.11 C 97.69 18.3 126.29 6.33 157.46 2.37 C 157.46 1.88 157.55 1.38 157.55 0.89 L 0.93 0.89 L 0.93 180.47 C 0.93 139.8 14.48 102.3 37.24 72.22 C 37.74 71.53 52.67 89.94 69.99 111.8 C 94.33 142.57 123.32 179.97 123.32 179.97 L 69.6 248.54 L 37.63 289.3 C 47.83 302.66 59.9 314.53 73.35 324.63 L 102.05 284.26 L 157.75 205.7 L 157.75 308.6 C 165.17 309.88 172.79 310.58 180.51 310.58 C 189.42 310.58 198.02 309.69 206.43 308.01 L 206.43 205.7 L 261.05 282.67 C 273.71 272.58 284.6 260.31 292.81 246.26 Z M 180.51 192.44 C 173.88 192.44 168.44 187 168.44 180.37 C 168.44 173.74 173.88 168.3 180.51 168.3 C 187.14 168.3 192.58 173.64 192.58 180.37 C 192.48 187.1 187.14 192.44 180.51 192.44 Z M 180.51 192.44 M 157.64 2.27 L 157.64 52.47 C 137.02 56.14 118.08 64.68 102.01 76.78 L 73.65 36.1 C 97.75 18.24 126.4 6.34 157.64 2.27 Z M 157.64 2.27 M 180.47 0.89 L 157.63 0.89 M 180.58 359.97 L 0.93 359.97 L 0.93 180.32 C 0.93 221.2 14.59 259.01 37.65 289.2 C 47.85 302.56 59.92 314.44 73.38 324.54 C 97.53 342.55 126.44 354.63 157.81 358.59 C 165.24 359.48 172.86 359.97 180.58 359.97 Z M 180.58 359.97 M 206.28 359.97 L 180.47 359.97 M 324.45 287.69 C 314.52 301 302.71 312.92 289.6 323.04 L 260.79 282.53 C 273.51 272.4 284.43 260.08 292.67 245.98 Z M 324.45 287.69 M 123.45 179.94 L 69.53 248.64 C 57.31 228.81 50.26 205.42 50.26 180.43 C 50.26 155.15 57.41 131.56 69.92 111.63 C 94.35 142.37 123.45 179.94 123.45 179.94 Z M 123.45 179.94 M 157.64 52.29 L 157.64 156.56 L 101.92 76.72 C 118.01 64.51 136.99 55.97 157.64 52.29 Z M 157.64 52.29 M 157.84 205.3 L 157.84 308.59 C 137.08 304.91 118.01 296.37 101.92 284.15 Z M 157.84 205.3 M 180.48 168.24 C 187.2 168.24 192.65 173.69 192.65 180.41 C 192.65 187.13 187.2 192.58 180.48 192.58 C 173.76 192.58 168.31 187.13 168.31 180.41 C 168.31 173.69 173.76 168.24 180.48 168.24 Z M 180.48 168.24 M 50.53 180.47 C 50.53 205.41 57.58 228.78 69.78 248.57 L 37.73 289.36 C 14.62 259.17 0.93 221.45 0.93 180.47 C 0.93 139.78 14.52 102.26 37.34 72.17 C 37.83 71.47 52.81 89.89 70.17 111.76 C 57.67 131.66 50.53 155.22 50.53 180.47 Z M 50.53 180.47 M 157.84 308.39 L 157.84 358.51 C 126.4 354.54 97.45 342.43 73.25 324.37 L 102.01 283.88 C 118.08 296.19 137.12 304.72 157.84 308.39 Z M 157.84 308.39 M 157.84 205.3 L 157.84 308.59 C 137.08 304.91 118.01 296.37 101.92 284.15 Z M 157.84 205.3 M 206.38 307.73 L 206.38 358.09 C 197.94 359.28 189.2 359.97 180.37 359.97 C 172.62 359.97 164.97 359.48 157.53 358.48 L 157.53 308.33 C 164.97 309.62 172.62 310.31 180.37 310.31 C 189.3 310.31 198.04 309.42 206.38 307.73 Z M 206.38 307.73 M 289.76 322.81 C 265.96 341.15 237.4 353.55 206.26 358.01 L 206.26 205.3 L 261.01 282.45 Z M 289.76 322.81 M 289.17 37.46 L 260.81 78.22 C 245.14 65.92 226.6 57.09 206.26 53.03 L 206.26 2.75 C 237.11 7.11 265.47 19.41 289.17 37.46 Z M 289.17 37.46 M 260.86 78.09 L 206.26 156.55 L 206.26 52.87 C 226.51 56.94 245.07 65.78 260.86 78.09 Z M 260.86 78.09 M 360.01 180.32 L 360.01 359.97 L 206.17 359.97 L 206.17 358.09 C 237.25 353.64 265.76 341.17 289.53 322.95 C 302.69 312.86 314.38 300.98 324.28 287.72 C 346.75 257.72 360.01 220.61 360.01 180.32 Z M 360.01 180.32 M 360.01 0.89 L 360.01 180.54 C 360.01 140.25 346.75 103.04 324.28 73.04 C 314.28 59.58 302.4 47.7 289.03 37.51 C 265.37 19.49 237.05 7.22 206.26 2.77 L 206.26 0.89 Z M 360.01 0.89 M 310.58 180.43 C 310.58 204.53 304.04 227.03 292.72 246.37 L 242.42 180.43 L 292.63 114.39 C 304.04 133.73 310.58 156.34 310.58 180.43 Z M 310.58 180.43 M 324.33 72.97 L 292.56 114.78 C 284.22 100.68 273.4 88.27 260.5 78.14 L 288.89 37.32 C 302.29 47.55 314.2 59.56 324.33 72.97 Z M 324.33 72.97 M 360.01 180.43 C 360.01 220.74 346.72 257.87 324.3 287.88 L 292.55 246.29 C 303.96 226.97 310.41 204.49 310.41 180.43 C 310.41 156.37 303.86 133.88 292.45 114.48 L 324.2 72.78 C 346.72 102.79 360.01 140.03 360.01 180.43 Z M 360.01 180.43","size":[360.86,360.86]};
  var NAME = {
    2: 'großes Kreuz mit der Ecke oben links', 3: 'Ecke oben rechts', 4: 'Außenring oben links', 5: 'Außenring oben rechts, oberes Stück',
    6: 'Außenring oben rechts, kleines Stück', 7: 'Innenkreis oben links', 8: 'Innenkreis oben rechts', 9: 'Außenring links',
    10: 'Außenring rechts', 11: 'Innenkreis links', 12: 'Innenkreis rechts', 13: 'kleiner Kreis in der Mitte', 14: 'Ecke unten rechts',
    15: 'Ecke unten links', 16: 'Innenkreis unten links', 17: 'Innenkreis unten rechts', 18: 'Außenring unten rechts, kleines Stück',
    19: 'Außenring unten links', 20: 'Außenring unten Mitte'
  };
  var IDS = Object.keys(BOARD.regions).map(Number).sort(function (a, b) { return a - b; });
  var NB = {};
  IDS.forEach(function (i) { NB[i] = []; });
  BOARD.adj.forEach(function (e) { NB[e[0]].push(e[1]); NB[e[1]].push(e[0]); });

  /* Farben (Muster zusätzlich zur Farbe, damit sie auch ohne Farbsehen unterscheidbar sind) */
  var COLORS = [
    { name: 'Rot', v: 'var(--c1)' },
    { name: 'Orange', v: 'var(--c2)' },
    { name: 'Türkis', v: 'var(--c3)' },
    { name: 'Grün', v: 'var(--c6)' },
    { name: 'Blau', v: 'var(--c4)' },
    { name: 'Lila', v: 'var(--c5)' }
  ];
  function pat(i) { return P + '-p' + i; }
  function defs() {
    var d = '';
    d += '<pattern id="' + pat(0) + '" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" style="fill:' + COLORS[0].v + '"/><rect x="5" width="3" height="8" style="fill:var(--paper);opacity:.55"/></pattern>';
    d += '<pattern id="' + pat(1) + '" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" style="fill:' + COLORS[1].v + '"/><rect width="6" height="6" style="fill:var(--paper);opacity:.5"/><rect x="6" y="6" width="6" height="6" style="fill:var(--paper);opacity:.5"/></pattern>';
    d += '<pattern id="' + pat(2) + '" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" style="fill:' + COLORS[2].v + '"/><circle cx="4.5" cy="4.5" r="1.9" style="fill:var(--paper);opacity:.75"/></pattern>';
    d += '<pattern id="' + pat(3) + '" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" style="fill:' + COLORS[3].v + '"/><rect width="4" height="10" style="fill:var(--ink);opacity:.5"/></pattern>';
    d += '<pattern id="' + pat(4) + '" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" style="fill:' + COLORS[4].v + '"/></pattern>';
    d += '<pattern id="' + pat(5) + '" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="10" height="10" style="fill:' + COLORS[5].v + '"/><rect width="4" height="10" style="fill:var(--paper);opacity:.65"/></pattern>';
    return d;
  }

  /* offizielle Lösung (Heft): rot = große Fläche und die Ecken oben/unten rechts, Kreisflächen blau und gelb (hier Blau und Orange) */
  var SOLUTION = {};
  [2, 3, 14].forEach(function (i) { SOLUTION[i] = 0; });
  [4, 5, 9, 10, 13, 17, 19].forEach(function (i) { SOLUTION[i] = 4; });
  [6, 7, 8, 11, 12, 15, 16, 18, 20].forEach(function (i) { SOLUTION[i] = 1; });

  function solutionValid() {
    return IDS.every(function (i) { return SOLUTION[i] !== undefined && NB[i].every(function (j) { return SOLUTION[j] !== SOLUTION[i]; }); });
  }
  /* kleinste Farbzahl per Backtracking (Absicherung der Lösung 3) */
  function minColors() {
    var order = IDS.slice().sort(function (a, b) { return NB[b].length - NB[a].length; });
    for (var k = 1; k <= 6; k++) {
      var col = {};
      var go = function (n) {
        if (n === order.length) return true;
        var v = order[n];
        for (var c = 0; c < k; c++) {
          if (NB[v].every(function (u) { return col[u] !== c; })) { col[v] = c; if (go(n + 1)) return true; delete col[v]; }
        }
        return false;
      };
      if (go(0)) return k;
    }
    return 7;
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, fills, cur, answer, mark;
  var svgBox, pathEls, swatches, chips, live, drag;

  function reset() { fills = {}; cur = null; answer = null; mark = null; IDS.forEach(function (i) { fills[i] = -1; }); }
  function countUsed() { var u = {}; IDS.forEach(function (i) { if (fills[i] >= 0) u[fills[i]] = 1; }); return Object.keys(u).length; }
  function fillOf(c) { return c >= 0 ? 'url(#' + pat(c) + ')' : ''; }

  function refresh() {
    IDS.forEach(function (i) {
      var p = pathEls[i], c = fills[i];
      p.style.fill = c >= 0 ? fillOf(c) : 'var(--surface)';
      p.setAttribute('aria-label', 'Fläche ' + (IDS.indexOf(i) + 1) + ', ' + NAME[i] + ': ' + (c >= 0 ? COLORS[c].name : 'nicht gefärbt'));
      p.setAttribute('aria-disabled', locked ? 'true' : 'false');
    });
    swatches.forEach(function (b, c) {
      b.setAttribute('aria-pressed', String(cur === c));
      b.disabled = !!locked;
    });
    chips.forEach(function (b, n) {
      var on = answer === n + 1, ok = n + 1 === RIGHT;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = (answer === null ? n === 0 : on) ? 0 : -1;
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.className = P + '-chip' + (on ? ' selected' : '') + (on && mark === 'check' ? (ok ? ' right' : ' wrong') : '') + (on && mark === 'solution' ? ' right' : '');
    });
  }
  function paint(i, c) {
    if (locked || c === null) return;
    fills[i] = fills[i] === c ? -1 : c;
    refresh();
    live.textContent = 'Fläche ' + (IDS.indexOf(i) + 1) + ' ' + (fills[i] >= 0 ? 'ist jetzt ' + COLORS[fills[i]].name : 'ist nicht mehr gefärbt') + '. Verwendete Farben: ' + countUsed() + '.';
    api.changed();
  }
  function chooseAnswer(n, focus) {
    if (locked) return;
    answer = n;
    refresh();
    if (focus) chips[n - 1].focus();
    api.changed();
  }
  function onChipKey(e) {
    var k = e.key, i = chips.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % chips.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + chips.length - 1) % chips.length;
    if (to === null) return;
    e.preventDefault();
    chooseAnswer(to + 1, true);
  }

  /* Ziehen der Farbe auf eine Fläche (Maus, Touch, Stift); Antippen genügt auch: erst Farbe, dann Fläche */
  function regionAt(x, y) {
    var t = document.elementFromPoint(x, y);
    t = t && t.closest ? t.closest('[data-region]') : null;
    return t && el.contains(t) ? +t.getAttribute('data-region') : null;
  }
  function startDrag(e, c) {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { id: e.pointerId, c: c, x: e.clientX, y: e.clientY, ghost: null };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
  }
  function moveDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    if (!drag.ghost && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 8) {
      drag.ghost = h('div', { class: P + '-ghost', 'aria-hidden': 'true' });
      drag.ghost.innerHTML = '<svg viewBox="0 0 40 40"><rect width="40" height="40" style="fill:url(#' + pat(drag.c) + ')"/></svg>';
      document.body.appendChild(drag.ghost);
    }
    if (drag.ghost) {
      drag.ghost.style.left = e.clientX + 'px';
      drag.ghost.style.top = e.clientY + 'px';
      var r = regionAt(e.clientX, e.clientY);
      IDS.forEach(function (i) { pathEls[i].classList.toggle('over', i === r); });
    }
  }
  function endDrag(e, cancel) {
    if (!drag || drag.id !== e.pointerId) return;
    var d = drag;
    drag = null;
    if (d.ghost) {
      var r = cancel ? null : regionAt(e.clientX, e.clientY);
      d.ghost.remove();
      IDS.forEach(function (i) { pathEls[i].classList.remove('over'); });
      if (r !== null) { fills[r] = d.c; refresh(); live.textContent = 'Fläche ' + (IDS.indexOf(r) + 1) + ' ist jetzt ' + COLORS[d.c].name + '. Verwendete Farben: ' + countUsed() + '.'; api.changed(); }
    }
  }

  function boardSvg(f, labels, extraCls) {
    var s = '<svg viewBox="0 0 ' + BOARD.size[0] + ' ' + BOARD.size[1] + '" class="' + P + '-svg' + (extraCls ? ' ' + extraCls : '') + '" focusable="false">';
    IDS.forEach(function (i) {
      s += '<path d="' + BOARD.regions[i].d + '" fill-rule="evenodd" class="' + P + '-reg" style="fill:' + (f[i] >= 0 ? fillOf(f[i]) : 'var(--surface)') + '"/>';
    });
    s += '<path d="' + BOARD.outline + '" class="' + P + '-line"/>';
    (labels || []).forEach(function (l) {
      s += '<g><circle cx="' + BOARD.regions[l[0]].cx + '" cy="' + BOARD.regions[l[0]].cy + '" r="13" class="' + P + '-lc"/><text x="' + BOARD.regions[l[0]].cx + '" y="' + (BOARD.regions[l[0]].cy + 6) + '" text-anchor="middle" class="' + P + '-lt">' + l[1] + '</text></g>';
    });
    return s + '</svg>';
  }

  Biber.register({
    id: 'wievielefarben18',
    story: '<p>Das Bild unten soll schön bunt werden. Aber: Wenn zwei Flächen nebeneinander liegen, müssen sie verschiedene Farben haben. Flächen, die sich nur an einer Ecke berühren, liegen nicht nebeneinander.</p>' +
      '<p>Zum Ausprobieren kannst du die Farben auf das Bild ziehen. Verwende so wenige Farben wie möglich!</p>',
    question: 'Wie viele verschiedene Farben genügen?',
    howto: 'Ziehe eine Farbe auf eine Fläche. Du kannst auch erst eine Farbe und dann die Flächen antippen. Eine Fläche nochmal mit derselben Farbe antippen macht sie wieder weiß. Das Ausmalen ist zum Probieren; gewertet wird die Zahl, die du unten wählst.',
    explanation: function () {
      var f = {};
      IDS.forEach(function (i) { f[i] = SOLUTION[i]; });
      return '<p>Die richtige Antwort ist <strong>3</strong>. Mit drei Farben geht es: Die große Fläche mit der Ecke oben links und alle Flächen, die nicht daneben liegen (die Ecken oben und unten rechts), werden in der ersten Farbe gefärbt. Dann färbt man die Flächen im Kreis so weit wie möglich mit der zweiten Farbe, und alle übrigen mit der dritten.</p>' +
        '<div class="' + P + '-ex">' + boardSvg(f, [[5, '1'], [6, '2'], [3, '3']], P + '-exs') + '</div>' +
        '<p>Weniger als drei Farben gehen nicht: Die Flächen 1 und 2 liegen nebeneinander und brauchen verschiedene Farben. Fläche 3 liegt neben beiden, also braucht sie eine dritte Farbe.</p>' +
        '<p><em>Informatik:</em> Hier genügen drei Farben, aber nicht immer. Vier Farben reichen bei jeder Landkarte aus; das hat man erst mit Hilfe von Computerprogrammen bewiesen. Für ein gegebenes Bild die kleinste Farbzahl zu finden, kann sehr schwierig sein. Das ist ärgerlich, denn auch andere Probleme sind dann schwierig: Einen Stundenplan zu erstellen ist ebenfalls ein Färbeproblem. Die „Flächen“ sind die Unterrichtsstunden, „Nachbarn“ sind Stunden mit derselben Lehrkraft oder Klasse, und die „Farben“ sind die Zeiten in der Woche.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; drag = null; reset();
      var defsBox = h('span', { class: P + '-defs', 'aria-hidden': 'true' });
      defsBox.innerHTML = '<svg width="0" height="0" focusable="false"><defs>' + defs() + '</defs></svg>';
      svgBox = h('div', { class: P + '-boardsvg', role: 'group', 'aria-label': 'Bild mit 19 Flächen zum Ausmalen' });
      svgBox.innerHTML = '<svg viewBox="0 0 ' + BOARD.size[0] + ' ' + BOARD.size[1] + '" class="' + P + '-svg" focusable="false">' +
        IDS.map(function (i) {
          return '<path d="' + BOARD.regions[i].d + '" fill-rule="evenodd" class="' + P + '-reg" data-region="' + i + '" tabindex="0" role="button"/>';
        }).join('') + '<path d="' + BOARD.outline + '" class="' + P + '-line"/></svg>';
      pathEls = {};
      IDS.forEach(function (i) {
        var p = svgBox.querySelector('[data-region="' + i + '"]');
        pathEls[i] = p;
        p.addEventListener('click', function () { if (!locked && cur !== null) paint(i, cur); else if (!locked) live.textContent = 'Wähle zuerst eine Farbe.'; });
        p.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!locked && cur !== null) paint(i, cur); else if (!locked) live.textContent = 'Wähle zuerst eine Farbe.'; }
        });
      });
      swatches = COLORS.map(function (c, k) {
        var b = h('button', {
          type: 'button', class: P + '-sw', 'aria-pressed': 'false', 'aria-label': 'Farbe ' + c.name,
          onpointerdown: function (e) { startDrag(e, k); }, onpointermove: moveDrag,
          onpointerup: function (e) { endDrag(e, false); }, onpointercancel: function (e) { endDrag(e, true); },
          onclick: function () { if (!locked) { cur = cur === k ? null : k; refresh(); } },
          onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!locked) { cur = cur === k ? null : k; refresh(); } } }
        });
        b.innerHTML = '<svg viewBox="0 0 40 40" focusable="false" aria-hidden="true"><rect width="40" height="40" rx="4" style="fill:url(#' + pat(k) + ')"/></svg><span>' + c.name + '</span>';
        return b;
      });
      chips = [1, 2, 3, 4, 5, 6].map(function (n) {
        return h('button', {
          type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-label': n + (n === 1 ? ' Farbe' : ' Farben'),
          onclick: function () { chooseAnswer(n, false); }, onkeydown: onChipKey
        }, String(n));
      });
      live = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + '-board' }, defsBox,
        h('div', { class: P + '-paint' }, svgBox, h('div', { class: P + '-sws', role: 'group', 'aria-label': 'Farben' }, swatches)),
        h('div', { class: P + '-ans' }, h('span', { class: P + '-q', id: P + '-q' }, 'Es genügen'),
          h('div', { class: P + '-chips', role: 'radiogroup', 'aria-labelledby': P + '-q' }, chips), h('span', null, 'verschiedene Farben.'))), live);
      refresh();
    },
    isComplete: function () { return answer !== null; },
    evaluate: function () {
      var f = IDS.map(function (i) { return fills[i]; });
      return { correct: answer === RIGHT, answer: { n: answer, fills: f } };
    },
    setAnswer: function (ans) {
      reset();
      if (ans) {
        answer = typeof ans.n === 'number' ? ans.n : null;
        if (Array.isArray(ans.fills)) IDS.forEach(function (i, k) { var c = ans.fills[k]; fills[i] = typeof c === 'number' && c >= 0 && c < COLORS.length ? c : -1; });
      }
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      if (on) cur = null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      IDS.forEach(function (i) { fills[i] = SOLUTION[i]; });
      answer = RIGHT; mark = 'solution'; locked = true; cur = null;
      refresh();
    },
    _check: function () { return { valid: solutionValid(), min: minColors() }; }
  });
})();
