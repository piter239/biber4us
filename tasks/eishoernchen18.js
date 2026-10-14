/* Aufgabe Eishörnchen (2018, Klasse 5-6 mittel, 7-8 einfach): Muster erkennen, Vorschrift mit Wiederholung */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-eishoernchen18-';

  /* Eiskugeln und Waffel: Vektorformen aus dem Heft (Koordinaten relativ zur Kugel, 63 x 45) */
  var SHAPES = {
    G: '<g transform="translate(-78 -480.73)"><path fill="#2e7f7b" d="M 109.64 480.73 C 92.23 480.73 78.12 494.85 78.12 512.27 C 78.12 516.44 78.96 520.56 80.58 524.41 C 82.29 524.96 84.51 525.58 86 525.58 C 88.72 525.58 91.17 523.54 93.88 523.54 C 96.6 523.54 99.05 525.58 101.77 525.58 C 104.48 525.58 106.93 523.54 109.64 523.54 C 112.36 523.54 114.81 525.58 117.53 525.58 C 120.24 525.58 122.7 523.54 125.41 523.54 C 128.12 523.54 130.57 525.58 133.29 525.58 C 134.79 525.58 137.03 524.96 138.74 524.4 C 140.35 520.55 141.18 516.43 141.18 512.27 C 141.18 494.85 127.06 480.73 109.65 480.73 Z M 109.64 480.73 "/><path fill="#09090a" d="M 109.64 480.73 L 109.64 480.61 C 92.16 480.61 78 494.79 78 512.27 C 78 516.45 78.85 520.59 80.47 524.45 L 80.49 524.5 L 80.54 524.52 C 82.26 525.08 84.48 525.7 86 525.7 C 87.39 525.7 88.7 525.18 89.99 524.67 C 91.28 524.16 92.56 523.66 93.88 523.66 C 95.21 523.66 96.49 524.16 97.78 524.67 C 99.07 525.18 100.38 525.7 101.77 525.7 C 103.15 525.7 104.46 525.18 105.75 524.67 C 107.04 524.16 108.32 523.66 109.64 523.66 C 110.97 523.66 112.25 524.16 113.54 524.67 C 114.84 525.18 116.14 525.7 117.53 525.7 C 118.91 525.7 120.22 525.18 121.51 524.67 C 122.8 524.16 124.08 523.66 125.41 523.66 C 126.73 523.66 128.01 524.16 129.3 524.67 C 130.6 525.18 131.9 525.7 133.29 525.7 C 134.82 525.7 137.06 525.07 138.78 524.51 L 138.83 524.5 L 138.85 524.45 C 140.46 520.59 141.3 516.45 141.3 512.27 C 141.3 494.79 127.13 480.61 109.65 480.61 L 109.64 480.61 L 109.64 480.73 L 109.73 480.65 L 109.7 480.61 L 109.64 480.61 L 109.64 480.73 L 109.56 480.82 L 109.6 480.86 L 109.65 480.86 C 126.99 480.86 141.05 494.92 141.05 512.27 C 141.05 516.41 140.23 520.52 138.63 524.35 L 138.74 524.4 L 138.7 524.28 C 137 524.84 134.76 525.46 133.29 525.46 C 131.96 525.46 130.69 524.96 129.39 524.45 C 128.1 523.94 126.8 523.42 125.41 523.42 C 124.02 523.42 122.71 523.94 121.43 524.45 C 120.13 524.96 118.85 525.46 117.53 525.46 C 116.2 525.46 114.93 524.96 113.63 524.45 C 112.34 523.94 111.04 523.42 109.64 523.42 C 108.26 523.42 106.95 523.94 105.66 524.45 C 104.37 524.96 103.09 525.46 101.77 525.46 C 100.44 525.46 99.16 524.96 97.87 524.45 C 96.58 523.94 95.27 523.42 93.88 523.42 C 92.5 523.42 91.19 523.94 89.9 524.45 C 88.61 524.96 87.33 525.46 86 525.46 C 84.54 525.46 82.32 524.85 80.62 524.29 L 80.58 524.41 L 80.69 524.36 C 79.08 520.53 78.25 516.42 78.24 512.27 C 78.24 503.59 81.75 495.74 87.44 490.05 C 93.12 484.37 100.97 480.86 109.64 480.86 L 109.64 480.73 L 109.56 480.82 Z M 109.64 480.73 "/><path fill="#f8f11a" d="M 109.65 523.66 L 109.64 523.66 C 109.26 523.66 108.88 523.7 108.5 523.77 C 108.98 523.72 109.44 523.7 109.88 523.7 C 110.05 523.7 110.21 523.7 110.37 523.71 C 110.13 523.68 109.89 523.66 109.65 523.66 "/><path fill="#2d7e7a" d="M 109.68 481.03 C 107.71 481.03 105.74 481.23 103.78 481.64 C 92.24 484.07 83.51 491.99 79.6 503.6 C 78.82 505.91 78.47 508.88 78.47 511.85 C 78.48 517.81 79.89 523.8 82.09 524.61 C 83.09 524.97 84.27 525.16 85.48 525.16 C 86.9 525.16 88.35 524.9 89.56 524.39 C 90.32 524.08 91.09 523.86 91.89 523.73 C 92.54 523.54 93.2 523.42 93.88 523.42 C 94.8 523.42 95.69 523.65 96.56 523.95 C 97.22 524.09 97.91 524.28 98.63 524.5 C 100.03 524.95 100.88 525.16 101.72 525.16 C 102.44 525.16 103.16 525 104.22 524.69 C 105.07 524.45 105.85 524.25 106.57 524.09 C 107.57 523.72 108.58 523.42 109.64 523.42 C 110.65 523.42 111.62 523.69 112.56 524.04 C 112.89 524.12 113.23 524.22 113.57 524.34 C 115.22 524.9 116.5 525.18 117.69 525.18 C 118.84 525.18 119.91 524.92 121.16 524.39 C 121.67 524.18 122.34 523.99 123.05 523.84 C 123.82 523.6 124.6 523.42 125.41 523.42 C 126.22 523.42 127 523.6 127.77 523.84 C 128.47 523.99 129.15 524.18 129.65 524.39 C 130.93 524.93 132.26 525.2 133.6 525.2 C 134.73 525.2 135.86 525 136.96 524.62 C 138.41 524.11 138.85 523.53 139.55 521.16 C 140.4 518.31 140.82 515.39 140.82 512.46 C 140.82 507.79 139.75 503.11 137.63 498.73 C 132.38 487.87 121.2 481.03 109.68 481.03 "/><path fill="#08090a" d="M 93.88 523.42 C 93.2 523.42 92.54 523.54 91.89 523.73 C 92.43 523.65 92.98 523.61 93.55 523.61 C 94.49 523.61 95.49 523.72 96.56 523.95 C 95.69 523.65 94.8 523.42 93.88 523.42 M 109.64 523.42 C 108.58 523.42 107.57 523.72 106.57 524.09 C 107.26 523.95 107.9 523.84 108.5 523.77 C 108.88 523.7 109.26 523.66 109.64 523.66 L 109.65 523.66 C 109.89 523.66 110.13 523.68 110.37 523.71 C 111.12 523.74 111.84 523.85 112.56 524.04 C 111.62 523.69 110.65 523.42 109.64 523.42 M 125.41 523.42 C 124.6 523.42 123.82 523.59 123.05 523.84 C 123.88 523.67 124.74 523.56 125.41 523.56 C 126.08 523.56 126.94 523.67 127.77 523.84 C 127 523.59 126.22 523.42 125.41 523.42 "/><path fill="none" stroke="#08090a" stroke-width="0.243" stroke-linecap="round" stroke-linejoin="round" transform="matrix(1, 0, 0, -1, 132.42, 490.51)" d="M 0 -0 C 0 -0 -24.54 9.55 -51.99 -33.58 C -43.13 9.55 -13.12 8.18 -13.12 8.18 "/></g>',
    Y: '<g transform="translate(-78 -510.72)"><path fill="#f8f11b" d="M 109.57 510.72 C 92.16 510.72 78.04 524.84 78.04 542.25 L 78.04 542.25 C 78.05 546.42 78.89 550.55 80.5 554.39 C 82.21 554.95 84.43 555.56 85.93 555.56 C 88.64 555.56 91.1 553.53 93.81 553.53 C 96.52 553.53 98.98 555.56 101.69 555.56 C 104.4 555.56 106.86 553.53 109.57 553.53 C 112.29 553.53 114.74 555.56 117.45 555.56 C 120.17 555.56 122.62 553.53 125.33 553.53 C 128.05 553.53 130.5 555.56 133.21 555.56 C 134.72 555.56 136.95 554.94 138.67 554.38 C 140.27 550.54 141.1 546.42 141.1 542.25 C 141.1 524.84 126.99 510.72 109.57 510.72 Z M 109.57 510.72 "/><path fill="none" stroke="#08090a" stroke-width="0.243" stroke-linecap="round" stroke-linejoin="round" transform="matrix(1, 0, 0, -1, 119.85, 539.61)" d="M 0 -0 C 0.42 -0.45 -0.39 -0.78 -0.74 -0.69 C -1.67 -0.45 -1.78 0.76 -1.38 1.48 C -0.66 2.76 1.1 2.85 2.22 2.06 C 3.86 0.92 3.93 -1.45 2.75 -2.96 C 1.19 -4.96 -1.81 -5.01 -3.69 -3.44 C -6.07 -1.47 -6.1 2.17 -4.13 4.43 C -1.75 7.18 2.53 7.19 5.18 4.82 C 8.29 2.03 8.28 -2.89 5.51 -5.91 C 2.31 -9.4 -3.25 -9.37 -6.65 -6.2 C -10.52 -2.6 -10.46 3.61 -6.89 7.39 C -2.88 11.63 3.98 11.55 8.13 7.58 C 12.74 3.16 12.63 -4.34 8.26 -8.87 "/></g>',
    V: '<g transform="translate(-78 -540.61)"><path fill="#771d8d" d="M 109.57 540.61 C 92.16 540.61 78.04 554.72 78.04 572.14 C 78.05 576.31 78.89 580.43 80.5 584.28 C 82.21 584.84 84.43 585.45 85.93 585.45 C 88.64 585.45 91.1 583.41 93.81 583.41 C 96.52 583.41 98.98 585.45 101.69 585.45 C 104.4 585.45 106.86 583.41 109.57 583.41 C 112.29 583.41 114.74 585.45 117.45 585.45 C 120.17 585.45 122.62 583.41 125.33 583.41 C 128.05 583.41 130.5 585.45 133.21 585.45 C 134.72 585.45 136.95 584.83 138.67 584.27 C 140.27 580.43 141.1 576.3 141.1 572.14 C 141.1 554.72 126.99 540.61 109.57 540.61 Z M 109.57 540.61 "/><path fill="#502991" d="M 93.57 565.18 C 96.71 565.23 99.21 567.7 99.15 570.69 C 99.1 573.68 96.5 576.07 93.36 576.02 C 90.22 575.96 87.72 573.5 87.78 570.5 C 87.83 567.51 90.43 565.13 93.57 565.18 "/><path fill="#350e38" d="M 93.46 564.93 C 91.85 564.93 90.38 565.54 89.31 566.55 C 88.23 567.55 87.55 568.95 87.52 570.5 L 87.52 570.6 C 87.52 572.15 88.17 573.55 89.23 574.57 C 90.28 575.6 91.74 576.24 93.36 576.27 L 93.46 576.27 C 95.08 576.27 96.55 575.65 97.62 574.65 C 98.7 573.64 99.38 572.25 99.41 570.7 L 99.41 570.59 C 99.41 569.05 98.76 567.64 97.7 566.62 C 96.65 565.6 95.19 564.96 93.57 564.93 L 93.57 565.18 C 96.71 565.23 99.21 567.7 99.15 570.69 C 99.1 573.65 96.56 576.02 93.46 576.02 L 93.36 576.02 C 90.22 575.96 87.72 573.5 87.78 570.5 C 87.83 567.55 90.37 565.18 93.46 565.18 L 93.57 565.18 L 93.57 564.93 L 93.46 564.93 "/><path fill="#23143d" d="M 93.46 565.18 C 90.37 565.18 87.83 567.55 87.78 570.5 C 87.72 573.5 90.22 575.96 93.36 576.01 L 93.46 576.02 C 96.56 576.02 99.1 573.65 99.15 570.69 C 99.21 567.7 96.71 565.23 93.57 565.18 L 93.56 565.44 C 95.05 565.46 96.39 566.05 97.35 566.98 C 98.31 567.92 98.9 569.2 98.9 570.59 L 98.9 570.69 C 98.87 572.09 98.26 573.36 97.28 574.28 C 96.29 575.2 94.95 575.76 93.46 575.76 L 93.37 575.76 C 91.88 575.73 90.54 575.14 89.58 574.21 C 88.62 573.28 88.03 572 88.03 570.6 L 88.03 570.51 C 88.05 569.1 88.67 567.84 89.65 566.92 C 90.64 566 91.98 565.44 93.46 565.44 L 93.56 565.44 L 93.57 565.18 L 93.46 565.18 "/><path fill="#502991" d="M 111.98 569.67 C 115.12 569.73 117.62 572.19 117.57 575.18 C 117.51 578.17 114.92 580.55 111.78 580.5 C 108.64 580.45 106.14 577.98 106.19 575 C 106.25 572 108.84 569.62 111.98 569.67 "/><path fill="#350e38" d="M 111.88 569.42 C 110.27 569.42 108.8 570.04 107.72 571.04 C 106.65 572.04 105.97 573.44 105.94 574.99 L 105.94 575.09 C 105.94 576.64 106.59 578.04 107.64 579.07 C 108.7 580.09 110.16 580.73 111.78 580.76 L 111.88 580.76 C 113.49 580.76 114.96 580.14 116.04 579.14 C 117.11 578.14 117.79 576.74 117.82 575.19 L 117.82 575.09 C 117.82 573.54 117.17 572.13 116.12 571.11 C 115.06 570.09 113.61 569.45 111.99 569.42 L 111.98 569.67 C 115.12 569.73 117.62 572.19 117.57 575.18 C 117.52 578.14 114.98 580.5 111.88 580.5 L 111.78 580.5 C 108.64 580.45 106.14 577.98 106.19 575 C 106.25 572.04 108.79 569.67 111.88 569.67 L 111.98 569.67 L 111.99 569.42 L 111.88 569.42 "/><path fill="#23143d" d="M 111.88 569.67 C 108.79 569.67 106.25 572.04 106.19 575 C 106.14 577.98 108.64 580.45 111.78 580.5 L 111.88 580.5 C 114.98 580.5 117.52 578.14 117.57 575.18 C 117.62 572.19 115.12 569.73 111.98 569.67 L 111.98 569.93 C 113.46 569.95 114.8 570.54 115.77 571.48 C 116.73 572.41 117.32 573.68 117.32 575.09 L 117.32 575.18 C 117.29 576.59 116.68 577.85 115.69 578.77 C 114.71 579.68 113.36 580.25 111.88 580.25 L 111.79 580.25 C 110.3 580.23 108.96 579.64 108 578.7 C 107.04 577.77 106.45 576.49 106.45 575.09 L 106.45 575 C 106.47 573.59 107.09 572.33 108.07 571.41 C 109.05 570.49 110.4 569.93 111.88 569.93 L 111.98 569.93 L 111.98 569.67 L 111.88 569.67 "/></g>',
    P: '<g transform="translate(-78 -600.26)"><path fill="#f14a7f" d="M 109.64 600.26 C 92.23 600.26 78.12 614.38 78.12 631.79 L 78.12 631.79 C 78.12 635.96 78.96 640.09 80.58 643.93 C 82.29 644.49 84.51 645.11 86 645.11 C 88.72 645.11 91.17 643.07 93.88 643.07 C 96.6 643.07 99.05 645.11 101.77 645.11 C 104.48 645.11 106.93 643.07 109.64 643.07 C 112.36 643.07 114.81 645.11 117.53 645.11 C 120.24 645.11 122.7 643.07 125.41 643.07 C 128.12 643.07 130.57 645.11 133.29 645.11 C 134.79 645.11 137.03 644.48 138.74 643.93 C 140.35 640.08 141.18 635.96 141.18 631.79 C 141.18 614.38 127.06 600.26 109.65 600.26 Z M 109.64 600.26 "/><path fill="#ea0b74" d="M 133 622.93 L 127.6 622.46 L 124.38 626.79 L 123.16 621.55 L 118.01 619.86 L 122.66 617.1 L 122.69 611.72 L 126.79 615.25 L 131.96 613.62 L 129.84 618.56 Z M 133 622.93 "/><path fill="#74253c" d="M 133 622.93 L 133.1 622.86 Z M 122.68 613.56 L 122.56 613.61 L 122.54 617.03 L 117.72 619.89 L 123.06 621.65 L 124.32 627.07 L 127.65 622.59 L 133.26 623.07 L 133.1 622.86 L 129.98 618.55 L 131.52 614.95 L 131.4 614.92 L 129.84 618.56 L 133 622.93 L 127.6 622.46 L 124.38 626.79 L 123.16 621.55 L 118.01 619.86 L 122.66 617.1 Z M 124.52 613.13 L 124.35 613.15 L 126.79 615.25 L 129.66 614.34 L 129.48 614.27 L 126.82 615.11 Z M 124.52 613.13 "/><path fill="#65052e" d="M 122.8 613.52 L 122.68 613.56 L 122.66 617.1 L 118.01 619.86 L 123.16 621.55 L 124.38 626.79 L 127.6 622.46 L 133 622.93 L 129.84 618.56 L 131.4 614.92 L 131.28 614.89 L 129.7 618.58 L 132.75 622.79 L 127.54 622.33 L 124.44 626.51 L 123.26 621.46 L 118.3 619.83 L 122.78 617.16 Z M 124.35 613.15 L 124.2 613.18 L 126.76 615.38 L 129.84 614.41 L 129.66 614.34 L 126.79 615.25 Z M 124.35 613.15 "/><path fill="#ea0b74" d="M 122.5 633.41 L 119.92 632.3 L 117.63 633.93 L 117.89 631.13 L 115.64 629.45 L 118.38 628.83 L 119.27 626.17 L 120.71 628.59 L 123.52 628.62 L 121.66 630.73 Z M 122.5 633.41 "/><path fill="#74253c" d="M 122.5 633.41 L 122.62 633.38 Z M 117.63 633.93 L 117.89 631.13 L 115.64 629.45 L 118.38 628.83 L 119.27 626.17 L 120.71 628.59 L 123.52 628.62 L 121.66 630.73 L 122.5 633.41 L 119.92 632.3 Z M 119.24 625.88 L 118.29 628.73 L 115.35 629.39 L 117.77 631.18 L 117.49 634.18 L 119.94 632.44 L 122.7 633.62 L 122.62 633.38 L 121.8 630.76 L 123.79 628.5 L 120.78 628.46 Z M 119.24 625.88 "/><path fill="#65052e" d="M 117.78 633.68 L 118.02 631.07 L 115.92 629.51 L 118.47 628.94 L 119.3 626.46 L 120.64 628.71 L 123.25 628.73 L 121.53 630.7 L 122.31 633.2 L 119.91 632.16 Z M 119.27 626.17 L 118.38 628.84 L 115.64 629.45 L 117.89 631.13 L 117.63 633.93 L 119.92 632.3 L 122.5 633.41 L 121.66 630.73 L 123.52 628.62 L 120.71 628.59 Z M 119.27 626.17 "/></g>',
    cone: '<g transform="translate(-78 -702.68)"><path fill="#fab42e" d="M 140.88 702.68 L 109.35 784.08 L 77.83 702.68 C 77.83 702.68 83 704.72 85.71 704.72 C 88.42 704.72 90.88 702.68 93.59 702.68 C 96.3 702.68 98.76 704.72 101.47 704.72 C 104.18 704.72 106.64 702.68 109.35 702.68 C 112.07 702.68 114.52 704.72 117.23 704.72 C 119.95 704.72 122.4 702.68 125.11 702.68 C 127.83 702.68 130.28 704.72 133 704.72 C 135.71 704.72 140.88 702.68 140.88 702.68 "/></g>'
  };
  var FLAV = {
    P: { name: 'rosa mit Sternen' },
    Y: { name: 'gelb mit Spirale' },
    V: { name: 'lila mit Punkten' },
    G: { name: 'grün mit Streifen' }
  };
  var STEP = 30.03;          /* senkrechter Abstand der Kugeln */
  var SCW = 63.1, SCH = 44.9;
  var CONE_Y = 42.6;         /* Oberkante der Waffel */
  var VISIBLE = 7;           /* sichtbare Kugeln von unten */

  /* Die vier Hörnchen, jeweils von unten nach oben (die obere Kugel ist nur zum Teil zu sehen) */
  var OPTIONS = {
    A: ['Y', 'Y', 'P', 'V', 'V', 'Y', 'G'],
    B: ['P', 'P', 'G', 'Y', 'Y', 'V', 'V'],
    C: ['P', 'P', 'G', 'G', 'G', 'V', 'Y'],
    D: ['G', 'G', 'P', 'P', 'V', 'Y', 'Y']
  };
  var IDS = ['A', 'B', 'C', 'D'];
  var CORRECT = 'D';

  function svgStr(vb, w, inner, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="' + w + '" ' +
      (label ? 'role="img" aria-label="' + label + '"' : 'aria-hidden="true"') + ' focusable="false">' + inner + '</svg>';
  }
  function scoopIcon(f, w) { return svgStr('0 0 63.1 45', w, SHAPES[f]); }

  function coneSvg(letter) {
    var seq = OPTIONS[letter], i, inner = '';
    var top = -STEP * (VISIBLE - 1);
    for (i = 0; i < VISIBLE; i++) {
      inner += '<g transform="translate(0 ' + (-STEP * i).toFixed(2) + ')">' + SHAPES[seq[i]] + '</g>';
    }
    inner += '<g transform="translate(0 ' + CONE_Y + ')">' + SHAPES.cone + '</g>';
    /* Wolke: verdeckt den oberen Teil der obersten Kugel (nur die unteren Kugeln sind zu sehen) */
    var r = 8.15, y0 = top - 4, yb = top + 14;
    inner += '<path fill="#fff" d="M-2 ' + y0 + ' H65.2 V' + yb + ' a' + r + ' ' + r + ' 0 0 1 -' + 2 * r + ' 0 a' + r + ' ' + r + ' 0 0 1 -' + 2 * r + ' 0 a' + r + ' ' + r + ' 0 0 1 -' + 2 * r + ' 0 a' + r + ' ' + r + ' 0 0 1 -' + 2 * r + ' 0 Z"/>';
    return svgStr('-1 ' + (top - 2) + ' 65.2 ' + (CONE_Y + 83.4 - top), 100, inner);
  }

  function describe(letter) {
    return OPTIONS[letter].map(function (f, i) {
      return FLAV[f].name + (i === VISIBLE - 1 ? ' (oben nur teilweise sichtbar)' : '');
    }).join(', ');
  }

  var storyHtml = '<p>Die Eisdiele „Al Goritmo“ bietet diese vier Eissorten an:</p>' +
    '<div class="' + P + 'flav">' + ['P', 'Y', 'V', 'G'].map(function (f) {
      return '<span>' + scoopIcon(f, 64) + '</span>';
    }).join('') + '</div>' +
    '<p>Bei Al Goritmo werden die Eishörnchen streng nach dieser Vorschrift hergestellt:</p>' +
    '<ol class="' + P + 'steps" start="0">' +
    '<li><b>Schritt 0:</b> Nimm ein leeres Hörnchen.</li>' +
    '<li><b>Schritt 1:</b> Wähle zufällig eine Eissorte und gib zwei Kugeln dieser Eissorte hinzu.</li>' +
    '<li><b>Schritt 2:</b> Gib eine Kugel mit irgendeiner anderen Eissorte als in Schritt 1 hinzu.</li>' +
    '<li><b>Schritt 3:</b> Wenn die gewünschte Kugelzahl erreicht ist, höre auf. Ansonsten mache mit Schritt 1 weiter.</li></ol>' +
    '<p>Unten siehst Du einige Eishörnchen mit ihren unteren Kugeln.</p>';

  var el, api;
  var choice, locked, mark;

  function reset() { choice = null; mark = null; }

  function render() {
    var cards = IDS.map(function (id, i) {
      var cls = P + 'card' + (choice === id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === id) {
        var ok = id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && id === CORRECT) cls += ' right';
      var tab = choice ? (choice === id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      var card = h('button', {
        type: 'button', role: 'radio', class: cls, 'data-opt': id, 'aria-checked': String(choice === id),
        tabindex: tab, disabled: locked,
        'aria-label': 'Eishörnchen ' + id + ', von unten nach oben: ' + describe(id)
      },
        h('span', { class: P + 'name', 'aria-hidden': 'true' }, id + ')'),
        h('span', { class: P + 'pic' }),
        badge);
      card.querySelector('.' + P + 'pic').innerHTML = coneSvg(id);
      return card;
    });
    el.replaceChildren(h('div', { class: P + 'board', role: 'radiogroup', 'aria-label': 'Die vier Eishörnchen A bis D' }, cards));
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-opt="' + id + '"]');
    if (b) b.focus();
    api.changed('Eishörnchen ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    var b = e.target.closest('[data-opt]');
    if (b && !locked) pick(b.dataset.opt);
  }
  function onKey(e) {
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    var i = IDS.indexOf(b.dataset.opt), d = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') d = -1;
    else return;
    e.preventDefault();
    pick(IDS[(i + d + IDS.length) % IDS.length]);
  }

  function explainHtml() {
    var D = OPTIONS.D;
    var strip = function (items) {
      return '<div class="' + P + 'strip">' + items.map(function (it) {
        return '<span class="' + P + 'sc' + (it.bad ? ' bad' : '') + '">' + scoopIcon(it.f, 40) + '<i>' + it.t + '</i></span>';
      }).join('') + '</div>';
    };
    return '<p>Man liest das Hörnchen von unten nach oben. Nach der Vorschrift kommen immer zwei gleiche Kugeln (Schritt 1) und dann eine Kugel einer anderen Sorte (Schritt 2), danach geht es wieder von vorn los. Bei Hörnchen D stimmt das nur am Anfang:</p>' +
      strip([
        { f: D[0], t: 'Schritt 1' }, { f: D[1], t: 'Schritt 1' }, { f: D[2], t: 'Schritt 2' },
        { f: D[3], t: 'Schritt 1' }, { f: D[4], t: 'Fehler', bad: true }
      ]) +
      '<p>Nach der rosa Kugel müssten zwei gleiche Kugeln folgen (Schritt 1). Hier kommen aber rosa und lila, also zwei verschiedene. Deshalb kann D nicht von Al Goritmo stammen. Bei A, B und C folgen immer wieder zwei gleiche Kugeln und eine andere, soweit man es sieht.</p>' +
      '<p>Muster wie dieses entstehen durch Wiederholung von Anweisungen. Informatikerinnen und Informatiker schreiben Programme, die Muster und Abweichungen davon erkennen. Ganz sicher kann man aber nur sagen, dass ein Hörnchen <em>nicht</em> nach der Vorschrift entstanden ist. Ein Hörnchen, das passt, könnte auch durch Zufall oder in einer anderen Eisdiele entstanden sein.</p>';
  }

  Biber.register({
    id: 'eishoernchen18',
    story: storyHtml,
    question: 'Welches Eishörnchen stammt mit Sicherheit NICHT von Al Goritmo?',
    howto: 'Tippe auf das Eishörnchen, das Du für richtig hältst. Die oberste Kugel ist nur zum Teil zu sehen.',
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
      choice = ans && OPTIONS[ans.choice] ? ans.choice : null;
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
