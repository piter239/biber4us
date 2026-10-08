/* Aufgabe Ausmalbild (Biber 2022; Klasse 3-4 einfach): Blume mit drei Mustern so ausmalen, dass sich gleiche Muster nicht berühren.
   Die Umrisse stammen als Vektordaten aus dem Heft (Bildkoordinaten in pt); jede weiße Fläche ist ein eigenes Feld. */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-ausmalbild22-';
var D = {"o": "M 316.4 190.2 C 322.1 190.3 326.8 190.9 330.8 192 C 338.7 194.2 343.8 198.1 347.5 203 C 355 212.9 356.9 227.3 364.2 240 L 364.2 240 L 364.2 240 C 376.9 261.5 380.5 273.8 380.3 283.1 C 380.2 292.2 376.3 298.6 373.4 308.3 C 367.8 319.3 362.1 329.9 353.7 337.5 C 345.3 345.2 334.4 349.9 317.8 349.2 C 276.4 338.2 262.5 353.5 241.6 361.4 L 241.5 361.4 L 241.5 361.5 C 198.4 383.8 152.6 373.2 131.6 365.2 C 106.9 349.9 86.7 332.4 75.3 316.5 C 69.6 308.6 66.1 301 65.2 294.5 C 64.3 288 66 282.5 70.7 278.1 C 78.1 271.3 81.8 260.9 84.8 249.9 C 87.7 238.8 89.8 226.9 93.5 217 C 97.2 207.1 102.4 199.2 111.5 195.7 C 120.7 192.1 134.2 192.8 154.5 200.7 L 154.6 200.8 L 154.7 200.8 C 197.9 211.3 252.4 191.1 296.4 191.6 L 296.6 191.6 L 296.7 191.6 C 304.3 190.5 310.8 190.1 316.4 190.2 Z", "lines": ["M 316.5 187.5 C 310.7 187.4 304.1 187.8 296.5 188.9 C 251.6 188.4 197.3 208.4 155.3 198.2 C 134.7 190.1 120.6 189.2 110.5 193.2 C 100.4 197.1 94.8 205.8 90.9 216.1 C 87.1 226.3 85.1 238.3 82.2 249.2 C 79.3 260.1 75.6 269.9 68.8 276.1 L 68.8 276.1 L 68.8 276.1 C 63.5 281.1 61.6 287.7 62.5 294.9 C 63.5 302.1 67.2 309.9 73.1 318.1 C 84.9 334.5 105.3 352.1 130.3 367.6 L 130.4 367.7 L 130.5 367.7 C 151.9 375.9 198.5 386.7 242.6 363.9 L 242.7 363.9 C 264.2 355.7 276.6 341 317.3 351.8 L 317.5 351.9 L 317.6 351.9 C 334.8 352.7 346.7 347.6 355.5 339.5 C 364.4 331.5 370.2 320.5 375.8 309.5 L 375.9 309.4 L 375.9 309.2 C 378.7 299.8 382.9 293 383 283.1 C 383.2 273.1 379.3 260.3 366.6 238.6 L 366.6 238.6 C 359.6 226.6 357.8 212.1 349.7 201.4 C 345.6 196 340 191.7 331.5 189.4 C 327.2 188.2 322.3 187.6 316.5 187.5 Z M 316.4 190.2 C 322.1 190.3 326.8 190.9 330.8 192 C 338.7 194.2 343.8 198.1 347.5 203 C 355 212.9 356.9 227.3 364.2 240 L 364.2 240 L 364.2 240 C 376.9 261.5 380.5 273.8 380.3 283.1 C 380.2 292.2 376.3 298.6 373.4 308.3 C 367.8 319.3 362.1 329.9 353.7 337.5 C 345.3 345.2 334.4 349.9 317.8 349.2 C 276.4 338.2 262.5 353.5 241.6 361.4 L 241.5 361.4 L 241.5 361.5 C 198.4 383.8 152.6 373.2 131.6 365.2 C 106.9 349.9 86.7 332.4 75.3 316.5 C 69.6 308.6 66.1 301 65.2 294.5 C 64.3 288 66 282.5 70.7 278.1 C 78.1 271.3 81.8 260.9 84.8 249.9 C 87.7 238.8 89.8 226.9 93.5 217 C 97.2 207.1 102.4 199.2 111.5 195.7 C 120.7 192.1 134.2 192.8 154.5 200.7 L 154.6 200.8 L 154.7 200.8 C 197.9 211.3 252.4 191.1 296.4 191.6 L 296.6 191.6 L 296.7 191.6 C 304.3 190.5 310.8 190.1 316.4 190.2 Z M 316.4 190.2 ", "M 293.7 257.1 C 295.5 258.2 300 259.7 301.8 260.4 C 304.2 261.4 306.1 262.7 307.1 264.5 C 304.9 265 302.7 265.5 300.5 265.8 C 300.5 265.8 300.5 265.8 300.5 265.8 L 300.5 265.8 C 300.5 265.8 300.5 265.7 300.5 265.7 C 300.5 265.3 300.5 264.9 300.2 264.5 C 300 264.1 299.6 263.8 299.2 263.5 C 298.7 263.2 298 262.9 297.4 262.7 C 296.8 262.4 296.4 262.1 295.6 261.8 C 292.8 260.7 289.3 259.8 286.6 258.8 C 286.6 258.8 286.5 258.8 286.5 258.8 C 292.7 261.3 293.9 261.9 295.3 262.5 C 296.1 262.7 296.6 263 297.2 263.3 C 297.7 263.6 298.4 263.8 298.7 264.1 C 299.3 264.5 299.6 265.3 299.7 265.9 C 294.8 267.5 289.1 265.8 285.2 265.4 C 285.2 265.4 285.2 265.4 285.2 265.4 C 287.3 266.1 289.3 266.5 291.2 266.8 C 289.7 268.1 287.9 268.8 285.9 268.9 C 283.7 269.1 281.2 268.7 278.6 267.9 C 278.6 267.9 278.5 267.9 278.5 267.9 C 287.6 271.2 290.7 268.2 292.1 267 C 295.9 267.4 299.2 267.2 302.6 266.5 C 302.3 267.4 301.8 268.1 301.2 268.7 C 300.3 269.5 299.1 270.1 297.7 270.6 C 295 271.5 291.7 272.1 288.9 273.1 L 288.9 273.1 C 288.9 273.1 288.9 273.1 288.9 273.1 C 296.4 271.6 296.6 271.7 297.9 271.4 C 299.4 270.9 300.7 270.3 301.7 269.5 C 302.6 268.7 303.1 267.7 303.3 266.4 C 305.8 265.9 306.9 265.4 307.5 265.1 C 308.2 264.4 307.6 263.9 307.2 263.2 C 306.2 261.8 304.5 260.8 302.4 259.9 C 300.4 259 297.9 258.3 295.4 257.6 C 294.8 257.5 294.3 257.3 293.7 257.1 C 293.7 257.1 293.7 257.1 293.7 257.1 Z M 293.7 257.1 ", "M 283.7 217.7 C 281.9 217.7 280 217.8 278.1 217.9 L 278.1 217.9 C 268.1 218.5 257.8 220.8 247.6 223.9 C 240.8 226.1 234 228.6 227.3 231.3 C 225.8 227.7 223.6 224.5 220.2 222.2 C 217.1 220.1 213.3 219.2 209.6 219.2 C 199.6 219.5 189.4 223.7 182.5 231 C 182.4 231 182.3 230.9 182.2 230.9 C 179.1 229.6 175.4 229 171.7 229 C 170.8 229 169.9 229 169.1 229.1 C 164.5 229.4 160.1 230.5 156.8 232.6 C 156.5 232.8 156.3 232.9 156.1 233.1 C 152.3 228.2 147.7 223.9 142.4 220.7 C 140.2 219.8 137.8 219.6 135.4 219.6 C 126.6 219.4 116.1 224 114.5 233.6 C 113.4 240.9 116.6 248.1 121.4 253.5 C 119.9 254.4 118.7 255.5 117.6 256.8 C 114.9 260.3 113.5 264.9 113.1 269.8 C 112.3 279.6 115.4 290.6 122.4 295.1 L 122.5 295.2 L 122.6 295.2 C 123.9 295.7 125.2 296 126.6 296 C 125.4 297.7 124.4 299.4 123.7 301.4 C 120.2 311.1 120.8 323.8 129 331 C 136.1 336.3 145.4 332.3 151.8 328 C 153.9 326.5 156.1 325 158.2 323.4 C 158.7 323.8 159.3 324.2 160 324.6 C 164.1 326.9 169.4 327.9 174.7 327.8 C 179.7 327.7 184.8 326.7 188.8 324.9 C 189.5 325.9 190.3 326.9 191.2 327.9 C 198.1 332.5 207.4 330.6 214.6 327.6 C 222.1 324.6 229.2 317.2 227 308.6 C 226 305.1 224 302.2 221.5 299.6 C 222.8 298.6 223.9 297.5 224.9 296.1 C 227.8 292.1 229.4 286.8 229.8 281.4 C 230.2 276 229.4 270.4 227.3 265.7 C 226.6 264.2 225.8 262.8 224.7 261.5 C 226.9 258.7 228.3 255.5 228.8 251.9 C 229.1 249.8 229.4 247.6 229.4 245.3 C 237.2 242.6 245 239.9 252.5 237.7 C 271.5 232.1 289.1 229.5 302.3 235.4 L 302.3 235.4 L 302.4 235.4 C 312 239.3 318.8 245.7 323.5 254.1 C 320.7 255.6 318.4 256.6 316.7 257.3 C 315.8 257.7 315.1 258 314.6 258.1 C 314.4 258.1 314.3 258.1 314.2 258.1 C 309 254.6 303 251.8 297.1 251 C 291.1 250.1 285.2 251.3 281.2 255.8 L 281.2 255.8 C 278.4 259.1 275.7 260.3 272.6 260.9 C 269.5 261.6 266 261.5 262.3 262.1 L 259.2 262.6 L 261.6 264.5 C 271.6 272.3 281.4 278.4 290.9 279.8 C 300.3 281.2 309.5 277.8 317.3 267.2 C 317.3 267.1 317.3 267.1 317.4 267.1 C 317.5 267 317.8 266.9 318.1 266.8 C 318.7 266.5 319.6 266.1 320.7 265.7 C 322.5 264.9 324.9 264 327.4 262.8 C 331.7 275 332.9 290 332.1 306.2 L 332 307.3 L 333.1 307.6 C 336 308.3 338.7 308.3 341.1 307.3 C 343.5 306.4 345.5 304.4 346.9 301.4 L 347 301.2 L 347.1 300.9 C 349.5 268.3 337 239.7 307 222 L 306.9 221.9 L 306.8 221.9 C 299.5 219 291.7 217.8 283.7 217.7 Z M 283.6 220.4 C 291.4 220.5 298.8 221.7 305.7 224.4 C 334.8 241.6 346.6 268.7 344.4 300.4 C 343.2 302.8 341.8 304.2 340.1 304.8 C 338.6 305.4 336.7 305.3 334.7 304.9 C 335.4 288.8 334.3 273.7 329.7 261.2 C 329.7 261 329.5 260.8 329.5 260.5 C 329.1 259.3 328.6 258.2 328.1 257.3 C 323.2 246.3 315.3 237.7 303.4 232.9 C 303.4 232.9 303.4 232.9 303.4 232.9 C 289.1 226.6 270.9 229.4 251.7 235.1 C 244.4 237.2 236.9 239.8 229.5 242.4 C 229.4 239.5 229 236.6 228.2 233.9 C 234.8 231.2 241.6 228.6 248.4 226.5 C 258.5 223.4 268.5 221.2 278.2 220.6 C 280.1 220.5 281.9 220.4 283.6 220.4 Z M 209.7 222 C 211.4 222.1 213.1 222.3 214.8 222.7 C 224 225.2 227 235.7 226.8 244.2 C 226.7 249.4 225.9 255.2 222.9 259.5 C 221.2 258 219.1 256.8 216.7 256.3 L 216.6 256.2 L 216.4 256.2 C 208.2 256.3 202.6 258.7 197.8 261.7 C 196.8 262.4 195.8 263.1 194.8 263.8 C 192.6 260.1 189.5 257.1 185.7 255 C 189 251.6 191.2 246.8 190.1 239 L 190.1 239 L 190.1 238.9 C 189.4 236 187.5 233.8 184.8 232.2 C 185.9 231.1 187.2 230 188.6 229.2 C 194.6 224.8 202.1 221.9 209.7 222 Z M 134.5 222.3 C 137.2 222.2 139.8 222.7 142.2 223.6 C 146.7 226.7 150.8 230.6 154.1 234.9 C 152.4 236.9 151.5 239.3 151.9 242.1 L 151.9 242.1 L 151.9 242.2 C 153.6 250.4 155.8 255 158.3 257.8 C 155.7 260 153.6 262.7 152.2 265.8 C 151.8 265.4 151.4 264.9 151 264.5 C 146 259.2 139.9 254.3 130 251.7 L 129.8 251.7 L 129.7 251.6 C 129.4 251.6 129.1 251.6 128.8 251.6 C 127 251.6 125.4 251.9 124 252.3 C 122.1 250.1 120.5 247.8 119.1 245.3 C 116 239.2 115.9 230.3 122.2 226.2 C 125.8 223.7 130.2 222.4 134.5 222.3 Z M 171.6 231.7 C 175.1 231.7 178.5 232.3 181.2 233.4 C 184.6 234.7 186.8 236.8 187.4 239.5 C 188.5 247.1 186.4 250.8 183.1 253.7 C 180.3 252.6 177.2 251.9 174 251.9 C 169 251.9 164.3 253.5 160.4 256.1 C 158.3 253.8 156.3 249.8 154.6 241.7 C 154.1 238.8 155.5 236.7 158.2 234.9 C 161 233.2 165 232.1 169.3 231.8 C 170.1 231.7 170.8 231.7 171.6 231.7 Z M 293.2 253.4 C 294.4 253.4 295.5 253.5 296.7 253.6 C 302.2 254.4 308.1 257.1 313.1 260.6 C 313.7 261 314 260.9 314.3 260.9 C 314.6 260.8 314.9 260.8 315.2 260.7 C 315.9 260.5 316.8 260.2 317.8 259.8 C 319.5 259.1 321.9 257.9 324.6 256.5 C 325.2 257.7 325.8 258.9 326.4 260.3 C 323.9 261.4 321.5 262.4 319.7 263.2 C 318.6 263.6 317.7 264 317 264.3 C 316.6 264.5 316.3 264.6 316.1 264.7 C 315.8 264.9 315.6 264.9 315.2 265.4 C 307.8 275.6 299.9 278.4 291.3 277.1 C 283.5 276 275 270.9 266.3 264.4 C 268.5 264.2 270.8 264.1 273.1 263.6 C 276.6 262.9 280.1 261.2 283.3 257.5 L 283.3 257.6 C 285.8 254.7 289.3 253.4 293.2 253.4 Z M 128.6 254.3 C 128.9 254.3 129.1 254.4 129.4 254.4 C 138.7 256.8 144.3 261.2 149 266.3 C 149.7 267.1 150.4 267.8 151.1 268.6 C 150.3 270.9 149.9 273.4 149.9 276 C 149.9 279.2 150.5 282.3 151.7 285.1 C 148.4 286.6 145.2 288.1 142 289.4 C 134.8 292.5 128.1 294.3 123.7 292.7 C 118.3 289 115.1 279 115.8 270 C 116.2 265.5 117.5 261.4 119.8 258.5 C 121.9 255.9 124.7 254.3 128.6 254.3 Z M 174 254.6 C 185.8 254.6 195.4 264.2 195.4 276 C 195.4 287.9 185.8 297.4 174 297.4 C 162.2 297.4 152.6 287.9 152.6 276 C 152.6 264.2 162.2 254.6 174 254.6 M 216.2 259 C 220.2 260 223 262.8 224.9 266.9 C 226.7 271 227.5 276.1 227.1 281.2 C 226.7 286.2 225.2 291.1 222.7 294.5 C 220.2 297.9 216.9 299.9 212.6 299.9 C 203 295.3 198.6 290.9 195.6 286.6 C 197.2 283.4 198.1 279.8 198.1 276 C 198.1 272.5 197.3 269.2 196 266.2 C 197.1 265.4 198.2 264.7 199.3 264 C 203.7 261.2 208.7 259 216.2 259 Z M 317.3 267.2 C 317.2 267.2 317.2 267.2 317.3 267.2 M 152.8 287.5 C 154.5 290.5 156.7 293.2 159.4 295.2 C 156.6 300.6 154.1 306.3 153.3 313.1 L 153.3 313.2 C 153.1 316.5 154.3 319.3 156.2 321.5 C 155.5 322.1 154.8 322.6 154 323.2 C 147.9 327.5 140.2 333 132.4 329.9 C 124.8 325.6 123.7 315.4 124.8 307.5 C 125.3 303 127.3 299.2 130.1 295.9 C 134.2 295.4 138.6 293.8 143.1 291.9 C 146.3 290.5 149.6 289 152.8 287.5 Z M 194.2 289.2 C 197.4 293.6 202.3 298 211.8 302.5 L 212 302.6 L 212.3 302.6 C 214.9 302.7 217.2 302.1 219.2 301.1 C 221.2 303.3 223 305.7 224.2 308.5 C 226.6 315.7 220.4 322.2 214.3 324.8 C 207.7 327.7 199.5 329.7 192.9 325.8 C 192.3 325 191.8 324.3 191.3 323.5 C 194.5 321.5 196.7 318.6 196.7 315 L 196.7 315 L 196.7 314.9 C 196 308.4 191.9 302.3 187.1 296.2 C 189.9 294.4 192.3 292 194.2 289.2 Z M 161.7 296.7 C 165.3 298.9 169.5 300.1 174 300.1 C 177.9 300.1 181.5 299.2 184.7 297.6 C 189.5 303.6 193.3 309.5 194 315.1 C 194 317.9 191.9 320.3 188.3 322.1 C 184.7 323.9 179.6 325 174.7 325.1 C 169.7 325.2 164.8 324.2 161.3 322.3 C 157.9 320.3 155.8 317.5 156 313.3 C 156.8 307.2 159 301.8 161.7 296.7 Z M 161.7 296.7 "], "s": "M 283.6 220.4 C 291.4 220.5 298.8 221.7 305.7 224.4 C 334.8 241.6 346.6 268.7 344.4 300.4 C 343.2 302.8 341.8 304.2 340.1 304.8 C 338.6 305.4 336.7 305.3 334.7 304.9 C 335.4 288.8 334.3 273.7 329.7 261.2 C 329.7 261 329.5 260.8 329.5 260.5 C 329.1 259.3 328.6 258.2 328.1 257.3 C 323.2 246.3 315.3 237.7 303.4 232.9 C 303.4 232.9 303.4 232.9 303.4 232.9 C 289.1 226.6 270.9 229.4 251.7 235.1 C 244.4 237.2 236.9 239.8 229.5 242.4 C 229.4 239.5 229 236.6 228.2 233.9 C 234.8 231.2 241.6 228.6 248.4 226.5 C 258.5 223.4 268.5 221.2 278.2 220.6 C 280.1 220.5 281.9 220.4 283.6 220.4 Z", "p_tr": "M 209.7 222 C 211.4 222.1 213.1 222.3 214.8 222.7 C 224 225.2 227 235.7 226.8 244.2 C 226.7 249.4 225.9 255.2 222.9 259.5 C 221.2 258 219.1 256.8 216.7 256.3 L 216.6 256.2 L 216.4 256.2 C 208.2 256.3 202.6 258.7 197.8 261.7 C 196.8 262.4 195.8 263.1 194.8 263.8 C 192.6 260.1 189.5 257.1 185.7 255 C 189 251.6 191.2 246.8 190.1 239 L 190.1 239 L 190.1 238.9 C 189.4 236 187.5 233.8 184.8 232.2 C 185.9 231.1 187.2 230 188.6 229.2 C 194.6 224.8 202.1 221.9 209.7 222 Z", "p_tl": "M 134.5 222.3 C 137.2 222.2 139.8 222.7 142.2 223.6 C 146.7 226.7 150.8 230.6 154.1 234.9 C 152.4 236.9 151.5 239.3 151.9 242.1 L 151.9 242.1 L 151.9 242.2 C 153.6 250.4 155.8 255 158.3 257.8 C 155.7 260 153.6 262.7 152.2 265.8 C 151.8 265.4 151.4 264.9 151 264.5 C 146 259.2 139.9 254.3 130 251.7 L 129.8 251.7 L 129.7 251.6 C 129.4 251.6 129.1 251.6 128.8 251.6 C 127 251.6 125.4 251.9 124 252.3 C 122.1 250.1 120.5 247.8 119.1 245.3 C 116 239.2 115.9 230.3 122.2 226.2 C 125.8 223.7 130.2 222.4 134.5 222.3 Z", "p_t": "M 171.6 231.7 C 175.1 231.7 178.5 232.3 181.2 233.4 C 184.6 234.7 186.8 236.8 187.4 239.5 C 188.5 247.1 186.4 250.8 183.1 253.7 C 180.3 252.6 177.2 251.9 174 251.9 C 169 251.9 164.3 253.5 160.4 256.1 C 158.3 253.8 156.3 249.8 154.6 241.7 C 154.1 238.8 155.5 236.7 158.2 234.9 C 161 233.2 165 232.1 169.3 231.8 C 170.1 231.7 170.8 231.7 171.6 231.7 Z", "l": "M 293.2 253.4 C 294.4 253.4 295.5 253.5 296.7 253.6 C 302.2 254.4 308.1 257.1 313.1 260.6 C 313.7 261 314 260.9 314.3 260.9 C 314.6 260.8 314.9 260.8 315.2 260.7 C 315.9 260.5 316.8 260.2 317.8 259.8 C 319.5 259.1 321.9 257.9 324.6 256.5 C 325.2 257.7 325.8 258.9 326.4 260.3 C 323.9 261.4 321.5 262.4 319.7 263.2 C 318.6 263.6 317.7 264 317 264.3 C 316.6 264.5 316.3 264.6 316.1 264.7 C 315.8 264.9 315.6 264.9 315.2 265.4 C 307.8 275.6 299.9 278.4 291.3 277.1 C 283.5 276 275 270.9 266.3 264.4 C 268.5 264.2 270.8 264.1 273.1 263.6 C 276.6 262.9 280.1 261.2 283.3 257.5 L 283.3 257.6 C 285.8 254.7 289.3 253.4 293.2 253.4 Z", "p_l": "M 128.6 254.3 C 128.9 254.3 129.1 254.4 129.4 254.4 C 138.7 256.8 144.3 261.2 149 266.3 C 149.7 267.1 150.4 267.8 151.1 268.6 C 150.3 270.9 149.9 273.4 149.9 276 C 149.9 279.2 150.5 282.3 151.7 285.1 C 148.4 286.6 145.2 288.1 142 289.4 C 134.8 292.5 128.1 294.3 123.7 292.7 C 118.3 289 115.1 279 115.8 270 C 116.2 265.5 117.5 261.4 119.8 258.5 C 121.9 255.9 124.7 254.3 128.6 254.3 Z", "c": "M 174 254.6 C 185.8 254.6 195.4 264.2 195.4 276 C 195.4 287.9 185.8 297.4 174 297.4 C 162.2 297.4 152.6 287.9 152.6 276 C 152.6 264.2 162.2 254.6 174 254.6 Z", "p_r": "M 216.2 259 C 220.2 260 223 262.8 224.9 266.9 C 226.7 271 227.5 276.1 227.1 281.2 C 226.7 286.2 225.2 291.1 222.7 294.5 C 220.2 297.9 216.9 299.9 212.6 299.9 C 203 295.3 198.6 290.9 195.6 286.6 C 197.2 283.4 198.1 279.8 198.1 276 C 198.1 272.5 197.3 269.2 196 266.2 C 197.1 265.4 198.2 264.7 199.3 264 C 203.7 261.2 208.7 259 216.2 259 Z", "p_bl": "M 152.8 287.5 C 154.5 290.5 156.7 293.2 159.4 295.2 C 156.6 300.6 154.1 306.3 153.3 313.1 L 153.3 313.2 C 153.1 316.5 154.3 319.3 156.2 321.5 C 155.5 322.1 154.8 322.6 154 323.2 C 147.9 327.5 140.2 333 132.4 329.9 C 124.8 325.6 123.7 315.4 124.8 307.5 C 125.3 303 127.3 299.2 130.1 295.9 C 134.2 295.4 138.6 293.8 143.1 291.9 C 146.3 290.5 149.6 289 152.8 287.5 Z", "p_br": "M 194.2 289.2 C 197.4 293.6 202.3 298 211.8 302.5 L 212 302.6 L 212.3 302.6 C 214.9 302.7 217.2 302.1 219.2 301.1 C 221.2 303.3 223 305.7 224.2 308.5 C 226.6 315.7 220.4 322.2 214.3 324.8 C 207.7 327.7 199.5 329.7 192.9 325.8 C 192.3 325 191.8 324.3 191.3 323.5 C 194.5 321.5 196.7 318.6 196.7 315 L 196.7 315 L 196.7 314.9 C 196 308.4 191.9 302.3 187.1 296.2 C 189.9 294.4 192.3 292 194.2 289.2 Z", "p_b": "M 161.7 296.7 C 165.3 298.9 169.5 300.1 174 300.1 C 177.9 300.1 181.5 299.2 184.7 297.6 C 189.5 303.6 193.3 309.5 194 315.1 C 194 317.9 191.9 320.3 188.3 322.1 C 184.7 323.9 179.6 325 174.7 325.1 C 169.7 325.2 164.8 324.2 161.3 322.3 C 157.9 320.3 155.8 317.5 156 313.3 C 156.8 307.2 159 301.8 161.7 296.7 Z"};

  /* Flächen: Reihenfolge = Zeichenreihenfolge (o liegt unten). */
  var REGIONS = [
    { id: 'o', name: 'äußere Fläche' },
    { id: 'c', name: 'Mitte der Blume' },
    { id: 'p_t', name: 'Blütenblatt oben' },
    { id: 'p_tr', name: 'Blütenblatt oben rechts' },
    { id: 'p_r', name: 'Blütenblatt rechts' },
    { id: 'p_br', name: 'Blütenblatt unten rechts' },
    { id: 'p_b', name: 'Blütenblatt unten' },
    { id: 'p_bl', name: 'Blütenblatt unten links' },
    { id: 'p_l', name: 'Blütenblatt links' },
    { id: 'p_tl', name: 'Blütenblatt oben links' },
    { id: 's', name: 'Stiel' },
    { id: 'l', name: 'Blatt' }
  ];
  var IDS = REGIONS.map(function (r) { return r.id; });
  var NAME = {};
  REGIONS.forEach(function (r) { NAME[r.id] = r.name; });
  var RING = ['p_t', 'p_tr', 'p_r', 'p_br', 'p_b', 'p_bl', 'p_l', 'p_tl'];
  /* Nachbarschaften (aus den Umrissen berechnet: Abstand der Flächen = Strichstärke) */
  var EDGES = [];
  RING.forEach(function (p, i) {
    EDGES.push([p, RING[(i + 1) % 8]]);   /* Blütenblätter reihum */
    EDGES.push(['c', p]);                  /* Mitte grenzt an alle Blütenblätter */
    EDGES.push(['o', p]);                  /* außen grenzt an alle Blütenblätter */
  });
  EDGES.push(['o', 's'], ['o', 'l'], ['s', 'p_tr'], ['s', 'l']);

  var BRUSH = [
    { name: 'Grün mit Dreiecken', short: 'grün' },
    { name: 'Blau mit Wellen', short: 'blau' },
    { name: 'Gelb mit Punkten', short: 'gelb' }
  ];

  function conflicts(col) {
    var bad = {};
    EDGES.forEach(function (e) {
      if (col[e[0]] != null && col[e[0]] === col[e[1]]) { bad[e[0]] = true; bad[e[1]] = true; }
    });
    return bad;
  }
  function allSolutions() {
    var out = [], col = {};
    (function rec(i) {
      if (i === IDS.length) { out.push(JSON.parse(JSON.stringify(col))); return; }
      for (var c = 0; c < 3; c++) {
        col[IDS[i]] = c;
        var ok = EDGES.every(function (e) {
          return col[e[0]] === undefined || col[e[1]] === undefined || col[e[0]] !== col[e[1]];
        });
        if (ok) rec(i + 1);
      }
      delete col[IDS[i]];
    })(0);
    return out;
  }

  /* ---------- SVG ---------- */
  var VB = '58 184 330 206';
  function fillOf(c) { return c == null ? 'var(--surface)' : 'url(#' + P + 'pat' + c + ')'; }
  function defsSvg() {
    var s = '<defs>';
    s += '<pattern id="' + P + 'pat0" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" class="' + P + 'g0"/>' +
      '<path class="' + P + 'g0t" d="M1.5 4.5 L5 1.5 L5.5 6.2Z M7 11 L11 7.8 L11.3 11.6Z M7.5 3.5 L10.8 1 L11 5Z M1.6 11.4 L3.6 8.2 L5.2 11.4Z"/></pattern>';
    s += '<pattern id="' + P + 'pat1" width="12" height="8" patternUnits="userSpaceOnUse"><rect width="12" height="8" class="' + P + 'b0"/>' +
      '<path class="' + P + 'b0w" d="M0 2 q1.5 -2 3 0 t3 0 t3 0 t3 0 M-1.5 6 q1.5 -2 3 0 t3 0 t3 0 t3 0 t3 0"/></pattern>';
    s += '<pattern id="' + P + 'pat2" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" class="' + P + 'y0"/>' +
      '<circle class="' + P + 'y0d" cx="2.2" cy="2.2" r="0.9"/><circle class="' + P + 'y0d" cx="6.7" cy="6.7" r="0.9"/></pattern>';
    IDS.forEach(function (id) { s += '<path id="' + P + 'r-' + id + '" d="' + D[id] + '"/>'; });
    s += '<g id="' + P + 'lines">' + D.lines.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g>';
    return s + '</defs>';
  }
  function thumbSvg(col, label) {
    var s = '<svg class="' + P + 'thumb" viewBox="' + VB + '" role="img" aria-label="' + label + '">';
    IDS.forEach(function (id) { s += '<use href="#' + P + 'r-' + id + '" style="fill:' + fillOf(col[id]) + '"/>'; });
    return s + '<use href="#' + P + 'lines" class="' + P + 'lines"/></svg>';
  }
  function swatchSvg(c) {
    return '<svg viewBox="0 0 40 40" aria-hidden="true" class="' + P + 'sw"><circle cx="20" cy="20" r="17" style="fill:' + (c == null ? 'var(--surface)' : fillOf(c)) + '" class="' + P + 'swc"/>' +
      (c == null ? '<path d="M11 29 L29 11 M11 11 L29 29" class="' + P + 'er"/>' : '') + '</svg>';
  }

  var el, api, svg, regEls, palBtns, statusEl;
  var colors, brush, locked, mark;

  function reset() {
    colors = {};
    IDS.forEach(function (id) { colors[id] = null; });
    brush = 0; mark = null;
  }
  function count() { return IDS.filter(function (id) { return colors[id] != null; }).length; }
  function complete() { return count() === IDS.length; }
  function isOk() { return complete() && Object.keys(conflicts(colors)).length === 0; }

  function label(id) {
    var c = colors[id];
    return NAME[id].charAt(0).toUpperCase() + NAME[id].slice(1) + ': ' + (c == null ? 'noch leer' : BRUSH[c].name);
  }
  function refresh() {
    var bad = mark === 'check' ? conflicts(colors) : {};
    IDS.forEach(function (id) {
      var u = regEls[id];
      u.style.fill = fillOf(colors[id]);
      u.setAttribute('aria-label', label(id));
      u.setAttribute('tabindex', locked ? '-1' : '0');
      u.setAttribute('aria-disabled', locked ? 'true' : 'false');
      u.classList.toggle('bad', !!bad[id]);
      u.classList.toggle('locked', !!locked);
    });
    palBtns.forEach(function (b, i) {
      var on = brush === i;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      b.classList.toggle('selected', on);
      b.disabled = !!locked;
    });
    if (statusEl) statusEl.textContent = count() + ' von ' + IDS.length + ' Flächen ausgemalt.';
  }
  function paint(id) {
    if (locked) return;
    var c = brush === 3 ? null : brush;
    colors[id] = (c !== null && colors[id] === c) ? null : c;   /* gleiche Farbe nochmal: wieder löschen */
    refresh();
    api.changed();
  }
  function onClick(e) {
    var u = e.target.closest('[data-reg]');
    if (u) paint(u.getAttribute('data-reg'));
  }
  function onKey(e) {
    var u = e.target.closest ? e.target.closest('[data-reg]') : null;
    if (u && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); paint(u.getAttribute('data-reg')); }
  }
  function onPalKey(e) {
    var i = palBtns.indexOf(e.currentTarget), to = null, n = palBtns.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i + n - 1) % n;
    if (to === null) return;
    e.preventDefault();
    brush = to; refresh(); palBtns[to].focus();
  }

  function explanation() {
    var sols = allSolutions();
    return '<p>Die Mitte der Blume grenzt an alle acht Blütenblätter, und auch die äußere Fläche grenzt an alle Blütenblätter. Die Blütenblätter selbst berühren sich reihum, ' +
      'darum müssen sie abwechselnd zwei Muster tragen. Für die Mitte und die äußere Fläche bleibt dann nur das dritte Muster: beide bekommen dasselbe. ' +
      'Der Stiel berührt die äußere Fläche und ein Blütenblatt und bekommt das übrig bleibende Muster, das Blatt das Muster des Blütenblatts.</p>' +
      '<p>Man wählt also das Muster für die äußere Fläche (3 Möglichkeiten) und welche Blütenblätter welches der beiden anderen Muster bekommen (2 Möglichkeiten): Es gibt <strong>genau ' + sols.length + ' richtige Lösungen</strong>:</p>' +
      '<div class="' + P + 'sols">' + sols.map(function (s, i) { return thumbSvg(s, 'Lösung ' + (i + 1) + ' von ' + sols.length); }).join('') + '</div>' +
      '<p>Solche Aufgaben heißen in der Informatik <em>Färbungsprobleme</em>: Benachbarten Flächen sollen verschiedene Farben zugeordnet werden, zum Beispiel bei Landkarten. Vier Farben reichen dafür immer aus.</p>';
  }

  Biber.register({
    id: 'ausmalbild22',
    story: '<p>Das Bild einer Blume soll mit drei farbigen Mustern ausgemalt werden: grün mit Dreiecken, blau mit Wellen und gelb. Jede Fläche bekommt genau ein Muster.</p>' +
      '<p>Zwei Flächen, die sich berühren, dürfen nicht dasselbe Muster haben.</p>',
    question: 'Male das ganze Bild aus.',
    howto: 'Wähle unten ein Muster und tippe dann auf die Flächen, die du damit ausmalen willst. Tippst du dieselbe Fläche noch einmal an, wird sie wieder leer. Mit dem Radierer machst du eine Fläche leer.',
    explanation: explanation,
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var body = '<svg class="' + P + 'svg" viewBox="' + VB + '" role="group" aria-label="Blume zum Ausmalen: Mitte, acht Blütenblätter, Stiel, Blatt und äußere Fläche">' + defsSvg();
      IDS.forEach(function (id) {
        body += '<use href="#' + P + 'r-' + id + '" class="' + P + 'reg" data-reg="' + id + '" role="button"/>';
      });
      body += '<use href="#' + P + 'lines" class="' + P + 'lines"/></svg>';
      var fig = h('div', { class: P + 'fig' });
      fig.innerHTML = body;
      svg = fig.firstChild;
      regEls = {};
      [].forEach.call(svg.querySelectorAll('[data-reg]'), function (u) { regEls[u.getAttribute('data-reg')] = u; });
      palBtns = BRUSH.map(function (b, i) { return i; }).concat([3]).map(function (i) {
        var b = h('button', {
          type: 'button', role: 'radio', class: P + 'pal', 'data-brush': i,
          'aria-label': i === 3 ? 'Radierer' : 'Muster ' + BRUSH[i].name,
          onclick: function () { if (locked) return; brush = i; refresh(); },
          onkeydown: onPalKey
        });
        b.innerHTML = swatchSvg(i === 3 ? null : i) + '<span>' + (i === 3 ? 'Radierer' : BRUSH[i].short) + '</span>';
        return b;
      });
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      var pal = h('div', { class: P + 'palette', role: 'radiogroup', 'aria-label': 'Muster wählen' }, palBtns);
      el.replaceChildren(h('div', { class: P + 'board' }, fig, pal, statusEl));
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      refresh();
    },
    isComplete: function () { return complete(); },
    evaluate: function () { return { correct: isOk(), answer: JSON.parse(JSON.stringify(colors)) }; },
    setAnswer: function (ans) {
      reset();
      IDS.forEach(function (id) { colors[id] = ans && typeof ans[id] === 'number' ? ans[id] : null; });
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      var s = allSolutions()[0];
      IDS.forEach(function (id) { colors[id] = s[id]; });
      mark = 'solution';
      locked = true;
      refresh();
    }
  });
})();
