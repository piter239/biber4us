/* Aufgabe Liniennetz (2018, Klasse 3-4 schwer, 5-6 mittel, 7-8 einfach): Abstraktion und Reduktion */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-liniennetz18-';

  /* Karte: Vektorformen aus dem Heft (Koordinaten in pt der Heftseite) */
  var MAP = {"water":[{"d":"M 237.57 193.35 C 235.06 193.35 233.05 195.47 233.05 198.1 L 233.05 326.86 C 233.05 331.06 236.33 333.59 239.33 333.68 L 379.75 333.68 C 384.95 333.51 387.18 336.15 387.18 341.22 L 387.18 385.23 C 387.3 390.36 388.18 391.15 383.13 391.15 C 376.94 391.15 371.96 396.13 371.96 402.33 L 371.96 428.49 C 371.96 434.69 376.94 439.67 383.13 439.67 L 454.5 439.67 C 460.69 439.67 465.67 434.69 465.67 428.49 L 465.67 402.33 C 465.67 396.13 460.69 391.15 454.5 391.15 L 404.01 391.15 C 396.71 391.55 396.7 391.71 396.7 384.75 L 396.7 328.93 C 396.7 327.61 396.16 326.42 395.3 325.56 C 395.09 325.34 394.85 325.15 394.6 324.98 C 393.84 324.46 392.93 324.17 391.94 324.17 L 246.9 324.17 C 245.02 324.17 242.09 321.89 242.09 318.98 L 242.09 198.1 C 242.09 195.47 240.07 193.35 237.57 193.35 ","tr":null,"kind":"fill"},{"d":"M -0 -0 C -2.51 -0 -4.53 -2.13 -4.53 -4.76 L -4.53 -133.67 C -4.53 -137.88 -1.24 -140.42 1.76 -140.51 L 142.35 -140.51 C 147.56 -140.33 149.8 -142.98 149.8 -148.06 L 149.8 -192.12 C 149.92 -197.25 150.8 -198.04 145.74 -198.04 C 139.54 -198.04 134.55 -203.03 134.55 -209.24 L 134.55 -235.43 C 134.55 -241.63 139.54 -246.63 145.74 -246.63 L 217.19 -246.63 C 223.39 -246.63 228.38 -241.63 228.38 -235.43 L 228.38 -209.24 C 228.38 -203.03 223.39 -198.04 217.19 -198.04 L 166.64 -198.04 C 159.34 -198.45 159.32 -198.61 159.32 -191.64 L 159.32 -135.74 C 159.32 -134.43 158.79 -133.23 157.93 -132.37 C 157.71 -132.16 157.48 -131.96 157.23 -131.79 C 156.46 -131.28 155.55 -130.98 154.56 -130.98 L 9.35 -130.98 C 7.47 -130.98 4.52 -128.7 4.52 -125.79 L 4.52 -4.76 C 4.52 -2.13 2.51 -0 -0 -0 Z M -0 -0 ","tr":"matrix(1, 0, 0, -1, 237.57, 193.35)","kind":"stroke"}],"lines":{"L2":{"d":"M -0 -0 L 11.67 -0 C 24.74 -0 27.77 -1.59 36.44 -10.26 L 117.33 -91.15 C 126.36 -100.19 129.68 -101.01 141.67 -101.01 L 211.02 -101.01 ","tr":"matrix(1, 0, 0, -1, 197.37, 276.57)"},"L3":{"d":"M -0 0 L 128.18 -0.02 C 139.53 -0.02 143.39 1.7 150.68 8.07 C 157.98 14.44 157.96 18.51 157.96 28.19 L 157.98 67.54 C 157.98 79.02 159.39 81.68 166.99 89.28 L 194.45 116.74 C 203.52 125.81 206.69 126.86 218.71 126.86 L 243.39 126.85 ","tr":"matrix(1, 0, 0, -1, 197.37, 340.12)"},"L4":{"d":"M -0 -0 L 58.05 -0.02 C 70.67 -0.02 73.9 1.27 83.44 10.82 C 83.44 10.82 114.21 41.58 118.1 45.47 C 121.98 49.35 127.37 55.28 127.32 67.7 L 127.31 185.31 ","tr":"matrix(1, 0, 0, -1, 197.37, 403.67)"},"L1":{"d":"M -0 -0 L 37.17 37.17 C 45.6 45.6 46.79 48.42 46.79 59.57 L 46.78 83.22 C 46.77 93.97 45.61 96.69 38.91 104.44 C 32.21 112.19 27.15 113.28 15.84 113.27 L -4.12 113.27 C -17 113.27 -19.95 111.64 -28.47 103.07 L -46.6 84.87 C -55.72 75.7 -59.01 74.83 -71.13 74.83 L -94.87 74.83 C -107.83 74.83 -110.91 76.19 -119.51 84.74 L -163.54 128.57 C -172.55 137.56 -175.82 138.45 -187.75 138.43 L -251.29 138.34 ","tr":"matrix(1, 0, 0, -1, 449.02, 351.19)"}},"bones":[{"d":"M 324.51 292.01 C 321.91 292.01 319.8 294.12 319.8 296.72 C 319.8 299.32 321.91 301.43 324.51 301.43 C 326.16 301.43 327.68 300.57 328.54 299.16 L 351.16 299.16 C 352.01 300.57 353.54 301.43 355.18 301.43 C 357.78 301.43 359.89 299.32 359.89 296.72 C 359.89 294.12 357.78 292.01 355.18 292.01 C 353.56 292.01 352.06 292.84 351.2 294.21 L 328.5 294.21 C 327.64 292.84 326.13 292.01 324.51 292.01 ","tr":null,"stroke":false},{"d":"M -0 0 C -2.6 0 -4.71 -2.11 -4.71 -4.72 C -4.71 -7.32 -2.6 -9.43 -0 -9.43 C 1.65 -9.43 3.17 -8.57 4.03 -7.16 L 26.68 -7.16 C 27.53 -8.57 29.06 -9.43 30.7 -9.43 C 33.31 -9.43 35.42 -7.32 35.42 -4.72 C 35.42 -2.11 33.31 0 30.7 0 C 29.08 -0 27.58 -0.84 26.72 -2.2 L 3.99 -2.2 C 3.13 -0.84 1.62 -0 -0 0 Z M -0 0 ","tr":"matrix(1, 0, 0, -1, 324.51, 292.01)","stroke":true},{"d":"M 303.15 234.86 C 300.55 234.86 298.44 236.96 298.44 239.57 C 298.44 242.17 300.55 244.28 303.15 244.28 C 304.79 244.27 306.32 243.41 307.17 242.01 L 320.46 242.01 C 321.32 243.41 322.84 244.27 324.49 244.28 C 327.09 244.28 329.2 242.17 329.2 239.57 C 329.2 236.96 327.09 234.86 324.49 234.86 C 322.87 234.86 321.37 235.69 320.51 237.06 L 307.13 237.06 C 306.27 235.69 304.77 234.86 303.15 234.86 ","tr":null,"stroke":false},{"d":"M 0 -0 C -2.6 -0 -4.72 -2.11 -4.72 -4.71 C -4.72 -7.32 -2.6 -9.43 0 -9.43 C 1.65 -9.43 3.17 -8.57 4.03 -7.16 L 17.34 -7.16 C 18.19 -8.57 19.72 -9.43 21.37 -9.43 C 23.97 -9.43 26.08 -7.32 26.08 -4.71 C 26.08 -2.11 23.97 -0 21.37 -0 C 19.75 -0 18.25 -0.83 17.38 -2.21 L 3.99 -2.21 C 3.13 -0.83 1.62 -0 0 -0 Z M 0 -0 ","tr":"matrix(1, 0, 0, -1, 303.15, 234.86)","stroke":true},{"d":"M 260.27 339.67 C 260.27 342.27 262.38 344.38 264.98 344.38 C 267.58 344.38 269.69 342.27 269.69 339.67 C 269.69 338.02 268.83 336.5 267.42 335.65 L 267.42 322.35 C 268.83 321.5 269.69 319.97 269.69 318.32 C 269.69 315.73 267.58 313.62 264.98 313.62 C 262.38 313.62 260.27 315.73 260.27 318.32 C 260.27 319.94 261.11 321.45 262.48 322.3 L 262.48 335.68 C 261.11 336.54 260.27 338.05 260.27 339.67 ","tr":null,"stroke":false},{"d":"M 0 -0 C 0 -2.6 2.11 -4.72 4.71 -4.72 C 7.32 -4.72 9.43 -2.6 9.43 -0 C 9.43 1.65 8.57 3.17 7.16 4.02 L 7.16 17.34 C 8.57 18.19 9.43 19.72 9.43 21.37 C 9.43 23.97 7.32 26.08 4.71 26.08 C 2.11 26.08 0 23.97 0 21.37 C 0 19.75 0.83 18.24 2.21 17.38 L 2.21 3.99 C 0.83 3.13 0 1.62 0 -0 Z M 0 -0 ","tr":"matrix(1, 0, 0, -1, 260.27, 339.67)","stroke":true},{"d":"M 296.38 372.32 C 293.78 372.32 291.67 374.43 291.67 377.03 C 291.67 379.63 293.78 381.74 296.38 381.74 C 298.03 381.74 299.55 380.88 300.4 379.47 L 320.36 379.47 C 321.21 380.88 322.74 381.74 324.38 381.74 C 326.98 381.74 329.09 379.63 329.09 377.03 C 329.09 374.43 326.98 372.32 324.38 372.32 C 322.77 372.32 321.27 373.16 320.4 374.52 L 300.37 374.52 C 299.5 373.16 298 372.32 296.38 372.32 ","tr":null,"stroke":false},{"d":"M 0 0 C -2.6 0 -4.72 -2.11 -4.72 -4.72 C -4.72 -7.32 -2.6 -9.43 0 -9.43 C 1.65 -9.43 3.17 -8.57 4.03 -7.16 L 24.01 -7.16 C 24.86 -8.57 26.39 -9.43 28.04 -9.43 C 30.64 -9.43 32.75 -7.32 32.75 -4.72 C 32.75 -2.11 30.64 0 28.04 0 C 26.42 -0 24.91 -0.84 24.05 -2.2 L 3.99 -2.2 C 3.13 -0.84 1.62 -0 0 0 Z M 0 0 ","tr":"matrix(1, 0, 0, -1, 296.38, 372.32)","stroke":true}],"ends":[{"d":"M 197.99 208.29 C 200.59 208.29 202.7 210.4 202.7 213 C 202.7 215.6 200.59 217.71 197.99 217.71 C 195.39 217.71 193.28 215.6 193.28 213 C 193.28 210.4 195.39 208.29 197.99 208.29 ","tr":null,"stroke":false},{"d":"M -0 -0 C 2.6 -0 4.72 -2.11 4.72 -4.71 C 4.72 -7.32 2.6 -9.43 -0 -9.43 C -2.61 -9.43 -4.71 -7.32 -4.71 -4.71 C -4.71 -2.11 -2.61 -0 -0 -0 Z M -0 -0 ","tr":"matrix(1, 0, 0, -1, 197.99, 208.29)","stroke":true},{"d":"M 197.34 271.85 C 199.94 271.85 202.05 273.96 202.05 276.56 C 202.05 279.16 199.94 281.27 197.34 281.27 C 194.74 281.27 192.63 279.16 192.63 276.56 C 192.63 273.96 194.74 271.85 197.34 271.85 ","tr":null,"stroke":false},{"d":"M 0 0 C 2.61 0 4.71 -2.11 4.71 -4.72 C 4.71 -7.32 2.61 -9.43 0 -9.43 C -2.6 -9.43 -4.72 -7.32 -4.72 -4.72 C -4.72 -2.11 -2.6 0 0 0 Z M 0 0 ","tr":"matrix(1, 0, 0, -1, 197.34, 271.85)","stroke":true},{"d":"M 197.29 335.36 C 199.89 335.36 202 337.47 202 340.07 C 202 342.67 199.89 344.78 197.29 344.78 C 194.7 344.78 192.59 342.67 192.59 340.07 C 192.59 337.47 194.7 335.36 197.29 335.36 ","tr":null,"stroke":false},{"d":"M -0 0 C 2.6 0 4.72 -2.11 4.72 -4.72 C 4.72 -7.32 2.6 -9.43 -0 -9.43 C -2.6 -9.43 -4.71 -7.32 -4.71 -4.72 C -4.71 -2.11 -2.6 0 -0 0 Z M -0 0 ","tr":"matrix(1, 0, 0, -1, 197.29, 335.36)","stroke":true},{"d":"M 197.36 398.96 C 199.95 398.96 202.06 401.07 202.06 403.67 C 202.06 406.27 199.95 408.38 197.36 408.38 C 194.75 408.38 192.64 406.27 192.64 403.67 C 192.64 401.07 194.75 398.96 197.36 398.96 ","tr":null,"stroke":false},{"d":"M 0 0 C 2.6 0 4.71 -2.11 4.71 -4.72 C 4.71 -7.32 2.6 -9.43 0 -9.43 C -2.6 -9.43 -4.72 -7.32 -4.72 -4.72 C -4.72 -2.11 -2.6 0 0 0 Z M 0 0 ","tr":"matrix(1, 0, 0, -1, 197.35, 398.96)","stroke":true},{"d":"M 324.48 213.74 C 327.08 213.74 329.19 215.85 329.19 218.45 C 329.19 221.05 327.08 223.16 324.48 223.16 C 321.88 223.16 319.77 221.05 319.77 218.45 C 319.77 215.85 321.88 213.74 324.48 213.74 ","tr":null,"stroke":false},{"d":"M 0 0 C 2.61 0 4.71 -2.11 4.71 -4.72 C 4.71 -7.32 2.61 -9.43 0 -9.43 C -2.6 -9.43 -4.72 -7.32 -4.72 -4.72 C -4.72 -2.11 -2.6 0 0 0 Z M 0 0 ","tr":"matrix(1, 0, 0, -1, 324.48, 213.74)","stroke":true},{"d":"M 440.53 208.65 C 443.13 208.65 445.24 210.76 445.24 213.36 C 445.24 215.96 443.13 218.07 440.53 218.07 C 437.93 218.07 435.82 215.96 435.82 213.36 C 435.82 210.76 437.93 208.65 440.53 208.65 ","tr":null,"stroke":false},{"d":"M 0 0 C 2.61 0 4.72 -2.11 4.72 -4.72 C 4.72 -7.32 2.61 -9.43 0 -9.43 C -2.6 -9.43 -4.72 -7.32 -4.72 -4.72 C -4.72 -2.11 -2.6 0 0 0 Z M 0 0 ","tr":"matrix(1, 0, 0, -1, 440.53, 208.65)","stroke":true},{"d":"M 449 346.47 C 451.6 346.47 453.71 348.58 453.71 351.18 C 453.71 353.78 451.6 355.89 449 355.89 C 446.4 355.89 444.29 353.78 444.29 351.18 C 444.29 348.58 446.4 346.47 449 346.47 ","tr":null,"stroke":false},{"d":"M -0 0 C 2.6 0 4.71 -2.11 4.71 -4.72 C 4.71 -7.32 2.6 -9.43 -0 -9.43 C -2.6 -9.43 -4.71 -7.32 -4.71 -4.72 C -4.71 -2.11 -2.6 0 -0 0 Z M -0 0 ","tr":"matrix(1, 0, 0, -1, 449, 346.47)","stroke":true},{"d":"M 408.34 372.71 C 410.94 372.71 413.05 374.82 413.05 377.41 C 413.05 380.02 410.94 382.12 408.34 382.12 C 405.74 382.12 403.63 380.02 403.63 377.41 C 403.63 374.82 405.74 372.71 408.34 372.71 ","tr":null,"stroke":false},{"d":"M 0 -0 C 2.6 -0 4.71 -2.11 4.71 -4.71 C 4.71 -7.32 2.6 -9.43 0 -9.43 C -2.6 -9.43 -4.72 -7.32 -4.72 -4.71 C -4.72 -2.11 -2.6 -0 0 -0 Z M 0 -0 ","tr":"matrix(1, 0, 0, -1, 408.34, 372.71)","stroke":true}],"dots":[{"d":"M 249.3 207.9 C 250.7 207.9 251.82 209.03 251.82 210.42 C 251.82 211.82 250.7 212.95 249.3 212.95 C 247.91 212.95 246.78 211.82 246.78 210.42 C 246.78 209.03 247.91 207.9 249.3 207.9 ","c":"L1","tr":null},{"d":"M 289.59 220.51 C 290.98 220.51 292.11 221.64 292.11 223.04 C 292.11 224.43 290.98 225.56 289.59 225.56 C 288.19 225.56 287.06 224.43 287.06 223.04 C 287.06 221.64 288.19 220.51 289.59 220.51 ","c":"L1","tr":null},{"d":"M 339.79 269.2 C 341.18 269.2 342.31 270.34 342.31 271.73 C 342.31 273.12 341.18 274.25 339.79 274.25 C 338.4 274.25 337.27 273.12 337.27 271.73 C 337.27 270.34 338.4 269.2 339.79 269.2 ","c":"L1","tr":null},{"d":"M 375.7 271.39 C 377.09 271.39 378.22 272.52 378.22 273.91 C 378.22 275.31 377.09 276.44 375.7 276.44 C 374.3 276.44 373.18 275.31 373.18 273.91 C 373.18 272.52 374.3 271.39 375.7 271.39 ","c":"L1","tr":null},{"d":"M 453.74 232.96 C 455.13 232.96 456.26 234.09 456.26 235.48 C 456.26 236.88 455.13 238 453.74 238 C 452.35 238 451.21 236.88 451.21 235.48 C 451.21 234.09 452.35 232.96 453.74 232.96 ","c":"L1","tr":null},{"d":"M 474.51 319.58 C 475.91 319.58 477.04 320.71 477.04 322.1 C 477.04 323.5 475.91 324.62 474.51 324.62 C 473.12 324.62 471.99 323.5 471.99 322.1 C 471.99 320.71 473.12 319.58 474.51 319.58 ","c":"L1","tr":null},{"d":"M 410.6 252.22 C 411.99 252.22 413.12 253.35 413.12 254.74 C 413.12 256.13 411.99 257.26 410.6 257.26 C 409.21 257.26 408.07 256.13 408.07 254.74 C 408.07 253.35 409.21 252.22 410.6 252.22 ","c":"L1","tr":null},{"d":"M 413.35 208.37 C 414.74 208.37 415.87 209.5 415.87 210.89 C 415.87 212.29 414.74 213.41 413.35 213.41 C 411.96 213.41 410.83 212.29 410.83 210.89 C 410.83 209.5 411.96 208.37 413.35 208.37 ","c":"L3","tr":null},{"d":"M 372.25 236.78 C 373.64 236.78 374.78 237.91 374.78 239.3 C 374.78 240.69 373.64 241.82 372.25 241.82 C 370.86 241.82 369.73 240.69 369.73 239.3 C 369.73 237.91 370.86 236.78 372.25 236.78 ","c":"L3","tr":null},{"d":"M 352.4 312.93 C 353.8 312.93 354.93 314.06 354.93 315.46 C 354.93 316.85 353.8 317.98 352.4 317.98 C 351.01 317.98 349.88 316.85 349.88 315.46 C 349.88 314.06 351.01 312.93 352.4 312.93 ","c":"L3","tr":null},{"d":"M 318.6 335.05 C 319.99 335.05 321.12 336.18 321.12 337.57 C 321.12 338.97 319.99 340.1 318.6 340.1 C 317.2 340.1 316.07 338.97 316.07 337.57 C 316.07 336.18 317.2 335.05 318.6 335.05 ","c":"L3","tr":null},{"d":"M 225.59 335.05 C 226.98 335.05 228.11 336.18 228.11 337.57 C 228.11 338.97 226.98 340.1 225.59 340.1 C 224.2 340.1 223.07 338.97 223.07 337.57 C 223.07 336.18 224.2 335.05 225.59 335.05 ","c":"L3","tr":null},{"d":"M 229.96 277.45 C 231.36 277.45 232.48 278.57 232.48 279.97 C 232.48 281.36 231.36 282.49 229.96 282.49 C 228.57 282.49 227.44 281.36 227.44 279.97 C 227.44 278.57 228.57 277.45 229.96 277.45 ","c":"L2","tr":null},{"d":"M 299.26 346.24 C 300.65 346.24 301.78 347.37 301.78 348.76 C 301.78 350.15 300.65 351.28 299.26 351.28 C 297.86 351.28 296.73 350.15 296.73 348.76 C 296.73 347.37 297.86 346.24 299.26 346.24 ","c":"L2","tr":null},{"d":"M 357.62 372.47 C 359.01 372.47 360.14 373.61 360.14 375 C 360.14 376.39 359.01 377.52 357.62 377.52 C 356.23 377.52 355.09 376.39 355.09 375 C 355.09 373.61 356.23 372.47 357.62 372.47 ","c":"L2","tr":null},{"d":"M 226.09 398.71 C 227.48 398.71 228.62 399.84 228.62 401.23 C 228.62 402.63 227.48 403.76 226.09 403.76 C 224.7 403.76 223.57 402.63 223.57 401.23 C 223.57 399.84 224.7 398.71 226.09 398.71 ","c":"L4","tr":null},{"d":"M 266.62 397.54 C 268.02 397.54 269.15 398.66 269.15 400.06 C 269.15 401.45 268.02 402.58 266.62 402.58 C 265.23 402.58 264.11 401.45 264.11 400.06 C 264.11 398.66 265.23 397.54 266.62 397.54 ","c":"L4","tr":null},{"d":"M 321.96 273.52 C 323.36 273.52 324.48 274.64 324.48 276.04 C 324.48 277.43 323.36 278.56 321.96 278.56 C 320.57 278.56 319.44 277.43 319.44 276.04 C 319.44 274.64 320.57 273.52 321.96 273.52 ","c":"L4","tr":null},{"d":"M 493.2 275.43 C 494.6 275.43 495.73 276.56 495.73 277.95 C 495.73 279.35 494.6 280.48 493.2 280.48 C 491.81 280.48 490.68 279.35 490.68 277.95 C 490.68 276.56 491.81 275.43 493.2 275.43 ","c":"L1","tr":null}]};
  var COL = { 1: '#58c035', 2: '#f46d25', 3: '#a431a0', 4: '#2f3092' };
  var NAMES = { 1: 'Linie 1 (grün)', 2: 'Linie 2 (orange)', 3: 'Linie 3 (lila)', 4: 'Linie 4 (dunkelblau)' };
  var LABEL_Y = { 1: 213, 2: 276.6, 3: 340.1, 4: 403.7 };   /* Höhe der Starthaltestellen */
  var LINES = [1, 2, 3, 4];
  var CORRECT = 4;
  /* Umsteigestationen (zwischen welchen Linien man wechseln kann), von der Karte abgelesen */
  var TRANSFER = [[1, 4], [3, 4], [2, 3], [2, 4]];

  function tr(t) { return t ? ' transform="' + t + '"' : ''; }
  var boneSvg = function (b) { return b; };

  function mapSvg(sel) {
    var s = '<svg class="' + P + 'map" viewBox="104 188 402 262" role="img" aria-label="Liniennetz von Biberstadt mit den Linien 1 bis 4. Linie 1 endet am Zoo. Umsteigestationen sind durch kurze Balken zwischen zwei Linien markiert." focusable="false">';
    s += '<rect x="104" y="186" width="402" height="264" rx="6" fill="#fff"/>';
    MAP.water.forEach(function (w) {
      if (w.kind === 'fill') s += '<path fill="#cfdef3" d="' + w.d + '"' + tr(w.tr) + '/>';
      else s += '<path fill="none" stroke="#cfdef3" stroke-width="1.363" stroke-linejoin="round" d="' + w.d + '"' + tr(w.tr) + '/>';
    });
    LINES.forEach(function (n) {
      var l = MAP.lines['L' + n];
      var dim = sel && sel !== n;
      s += '<g class="' + P + 'line' + (sel === n ? ' on' : '') + (dim ? ' dim' : '') + '" data-ln="' + n + '">' +
        (sel === n ? '<path fill="none" stroke="#111" stroke-opacity="0.35" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" d="' + l.d + '"' + tr(l.tr) + '/>' : '') +
        '<path class="' + P + 'lp" fill="none" stroke="' + COL[n] + '" stroke-width="' + (sel === n ? 2.2 : 1.363) + '" stroke-linecap="round" stroke-linejoin="round" d="' + l.d + '"' + tr(l.tr) + '/>';
      MAP.dots.filter(function (d) { return d.c === 'L' + n; }).forEach(function (d) {
        s += '<path fill="' + COL[n] + '" d="' + d.d + '"' + tr(d.tr) + '/>';
      });
      s += '</g>';
    });
    /* Umsteigestationen (je ein Balken zwischen zwei Kreisen) und Endhaltestellen */
    var k, b;
    for (k = 0; k < MAP.bones.length; k += 2) {
      s += '<g class="' + P + 'bone" data-bone="' + (k / 2) + '">';
      for (b = k; b < k + 2; b++) {
        var o = MAP.bones[b];
        s += o.stroke ? '<path fill="none" stroke="#080a0b" stroke-width="0.785" d="' + o.d + '"' + tr(o.tr) + '/>' : '<path fill="#fff" d="' + o.d + '"' + tr(o.tr) + '/>';
      }
      s += '</g>';
    }
    MAP.ends.forEach(function (o) {
      s += o.stroke ? '<path fill="none" stroke="#080a0b" stroke-width="0.785" d="' + o.d + '"' + tr(o.tr) + '/>' : '<path fill="#fff" d="' + o.d + '"' + tr(o.tr) + '/>';
    });
    s += '<text x="451" y="370.5" font-size="14" font-weight="700" fill="#111" font-family="var(--font-display)">Zoo</text>';
    LINES.forEach(function (n) {
      s += '<g class="' + P + 'lab' + (sel === n ? ' on' : '') + '" data-line="' + n + '">' +
        '<rect x="109" y="' + (LABEL_Y[n] - 11) + '" width="80" height="22" rx="11" fill="#fff" stroke="' + COL[n] + '" stroke-width="' + (sel === n ? 2.4 : 1.2) + '"/>' +
        '<text x="149" y="' + (LABEL_Y[n] + 4.6) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#111" font-family="var(--font-display)">Linie ' + n + '</text></g>';
    });
    return s + '</svg>';
  }

  function legendBone() {
    return '<svg class="' + P + 'bonei" viewBox="0 0 64 20" width="46" height="14" role="img" aria-label="Balken zwischen zwei Kreisen" focusable="false">' +
      '<circle cx="10" cy="10" r="8" fill="var(--surface)" stroke="currentColor" stroke-width="1.6"/><circle cx="54" cy="10" r="8" fill="var(--surface)" stroke="currentColor" stroke-width="1.6"/>' +
      '<rect x="12" y="6.8" width="40" height="6.4" fill="var(--surface)"/><path d="M12 6.8 H52 M12 13.2 H52" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>';
  }

  var el, api;
  var choice, locked, mark;

  function reset() { choice = null; mark = null; }

  function render() {
    var buttons = LINES.map(function (n, i) {
      var cls = P + 'btn' + (choice === n ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === n) {
        var ok = n === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && n === CORRECT) cls += ' right';
      var tab = choice ? (choice === n ? '0' : '-1') : (i === 0 ? '0' : '-1');
      var dot = h('span', { class: P + 'dot', 'aria-hidden': 'true' });
      dot.style.background = COL[n];
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-line': String(n), 'aria-checked': String(choice === n),
        tabindex: tab, disabled: locked, 'aria-label': NAMES[n]
      }, dot, h('span', null, 'Linie ' + n), badge);
    });
    var map = h('div', { class: P + 'mapwrap' });
    map.innerHTML = mapSvg(choice);
    el.replaceChildren(h('div', { class: P + 'board' }, map,
      h('div', { class: P + 'btns', role: 'radiogroup', 'aria-label': 'Mit welcher Linie fährt Johannes los?' }, buttons)));
  }

  function pick(n) {
    if (locked) return;
    choice = n;
    render();
    var b = el.querySelector('button[data-line="' + n + '"]');
    if (b && document.activeElement && el.contains(document.activeElement)) b.focus();
    api.changed('Linie ' + n + ' ausgewählt.');
  }
  function onClick(e) {
    var b = e.target.closest('[data-line]');
    if (!b || locked) return;
    var wasButton = b.tagName === 'BUTTON';
    choice = +b.dataset.line;
    render();
    if (wasButton) el.querySelector('button[data-line="' + choice + '"]').focus();
    api.changed('Linie ' + choice + ' ausgewählt.');
  }
  function onKey(e) {
    var b = e.target.closest('button[data-line]');
    if (!b || locked) return;
    var i = LINES.indexOf(+b.dataset.line), d = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
    else return;
    e.preventDefault();
    pick(LINES[(i + d + LINES.length) % LINES.length]);
  }

  function graphSvg() {
    var pos = { 1: [70, 22], 4: [70, 80], 3: [26, 142], 2: [114, 142] };
    var r = 15, s = '<svg class="' + P + 'graph" viewBox="0 0 140 168" width="140" height="168" role="img" aria-label="Wechsel-Bild: Kreise 1 bis 4. Doppelpfeile verbinden 1 mit 4, 4 mit 3, 4 mit 2 und 3 mit 2." focusable="false">';
    function arrowHead(x, y, dx, dy) {
      var px = -dy, py = dx;
      return '<path fill="currentColor" d="M' + x + ' ' + y + ' L' + (x - dx * 7 + px * 3.4) + ' ' + (y - dy * 7 + py * 3.4) + ' L' + (x - dx * 7 - px * 3.4) + ' ' + (y - dy * 7 - py * 3.4) + ' Z"/>';
    }
    TRANSFER.forEach(function (t) {
      var a = pos[t[0]], b = pos[t[1]];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;
      var x1 = a[0] + dx * (r + 2), y1 = a[1] + dy * (r + 2), x2 = b[0] - dx * (r + 2), y2 = b[1] - dy * (r + 2);
      s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" stroke-width="1.6"/>' + arrowHead(x2, y2, dx, dy) + arrowHead(x1, y1, -dx, -dy);
    });
    LINES.forEach(function (n) {
      s += '<circle cx="' + pos[n][0] + '" cy="' + pos[n][1] + '" r="' + r + '" fill="' + COL[n] + '"/>' +
        '<text x="' + pos[n][0] + '" y="' + (pos[n][1] + 6.5) + '" text-anchor="middle" font-size="18" font-weight="700" fill="#fff" font-family="var(--font-display)">' + n + '</text>';
    });
    return s + '</svg>';
  }

  function explainHtml() {
    return '<div class="' + P + 'ex">' + graphSvg() +
      '<div><p>Johannes fährt mit <strong>Linie 4</strong> los. Nur von Linie 4 aus kann man an einer Station direkt zu Linie 1 wechseln. Dort steigt er um und fährt mit Linie 1 zum Zoo.</p>' +
      '<p>Das Bild zeigt nur noch das Wichtige: Jeder Kreis steht für eine Linie, und ein Doppelpfeil bedeutet, dass man zwischen diesen beiden Linien wechseln kann. Man sieht sofort, dass nur der Kreis 4 direkt mit dem Kreis 1 verbunden ist.</p></div></div>' +
      '<p>Dieses Bild ist durch <em>Abstraktion</em> entstanden: Alles, was für die Frage nicht wichtig ist (Streckenverlauf, Haltestellen, Zoo), wurde weggelassen. Außerdem wurde das Problem <em>reduziert</em>: Aus „Mit welcher Linie kann ich mit einmal Umsteigen zum Zoo fahren?“ wird die einfachere Frage „Welcher Kreis ist mit Kreis 1 verbunden?“. Weiß man, wie man ein bekanntes Problem löst, kann man ein neues, das sich darauf zurückführen lässt, genauso lösen.</p>';
  }

  Biber.register({
    id: 'liniennetz18',
    story: '<p>In Biberstadt gibt es vier Bahnlinien. Eine Linie fährt zum Zoo. An diesen Stationen ' + legendBone() + ' kann man von einer Linie zu einer anderen wechseln.</p>' +
      '<p>Johannes fährt zum Zoo. Er muss nur einmal die Linie wechseln.</p>',
    question: 'Mit welcher Linie fährt er los?',
    howto: 'Tippe auf die richtige Linie, entweder links in der Karte oder auf einen der Knöpfe unter der Karte.',
    explanation: explainHtml,
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && LINES.indexOf(ans.choice) >= 0 ? ans.choice : null;
      mark = choice ? 'check' : null;
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
