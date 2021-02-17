const faker = require('faker');
const db = require('./db');

// fake product images
const productImages = [
  'https://www.cheatsheet.com/wp-content/uploads/2016/04/Various-cleaning-supplies-on-a-white-background.jpg',
  'https://www.waste360.com/sites/waste360.com/files/Tupperware-Image2.jpg',
  'https://www.tablets-computer.com/wp-content/uploads/aes/Tablets-Computer_287180.jpg',
  'https://image.ec21.com/image/ginnywang/oimg_GC01704093_CA01704096/Plastic-Mouse.jpg',
  'https://www.pcrichard.com/images/product/large/Z_22570E.jpg',
  'https://cdn.shopify.com/s/files/1/0279/8750/9332/products/1837GARLICPRESS-1191-2ONLINE_1024x1024@2x.jpg?v=1591295654',
  'https://cdn.shopify.com/s/files/1/2620/9736/products/garlic-press-innovation-6_1024x1024.jpg?v=1567235795',
  'https://www.rei.com/media/82435151-a36b-4060-85a0-19d2c2575ece?size=512x682',
  'https://www.slrlounge.com/wp-content/uploads/2016/08/product-photography-raw-image.jpg',
  'https://hikingmastery.com/wp-content/uploads/2018/02/edc-multitool-featured-810x549.png',
  'https://cleverleverage.com/wp-content/uploads/2017/02/product-image-4.jpeg',
  'https://www.tlc-direct.co.uk/Images/Products/size_3/LU6144S-2GR.JPG',
  'https://hubbellcdn.com/prodimage1200/BEA_SLIDE_PRODIMAGE_1200.jpg',
  'https://i0.wp.com/myhelpfulhints.co.uk/wp-content/uploads/2018/07/71VMB1T3V7L._SL1200_.jpg?ssl=1https://www.bazaargadgets.com/image/cache/catalog/products/lights/ledlightbulbs/MR163WWhite3LEDSpotlightLEDLightBulb12-24V-SKUspanitemprop089558-3-800x800.jpg',
  'http://image.ec21.com/image/weifeng811/OF0010672822_1/Sell_Led_Light_Shower_head.jpg',
  'http://image.ec21.com/image/sinceryhk/oimg_GC02424711_CA02639244/LED_Phototherapy_Light_for_PDT_BS-LED2.jpg',
  'https://www.tlc-direct.co.uk/Images/Products/size_3/SK151568.JPG',
  'http://www.light-therapy.net/wp-content/uploads/2016/03/img_0040.jpg',
  'https://www.northerntool.com/images/product/700x700/168/1681517_700x700.jpg',
  'https://redlighttherapy.lighttherapyoptions.com/wp-content/uploads/2017/09/61Mlt8jSXrL._SX522_.jpg',
  'https://www.destinationlighting.com/images/products_zoom/495/P1914495.alt1~zoom.jpg',
  'https://thegadgetflow.com/wp-content/uploads/2016/04/Mars-Levitating-Speaker-by-crazybaby-03.jpeg',
  'https://cdn.shopify.com/s/files/1/0106/5775/9290/products/ibac8e9c17ac24010c144a5c995a8428d9_620x.jpg?v=1558758056',
  'http://ueeshop.ly200-cdn.com/u_file/UPAH/UPAH820/1907/products/30/d2af722fce.png',
  'https://cnet4.cbsistatic.com/img/muHld64f0hM3Mu0OCtfjRafF9qQ=/670x503/2016/08/05/20849a3b-8eeb-4732-b5ac-5698a10e5a6b/aukey-wheel-speaker.jpg',
  'https://www.crazystereo.com/media/product/3e5/audiofrog-gb12d2-by-audiofrog-store-663.jpg',
  'https://www.adoptionbirthmothers.com/wp-content/uploads/2013/06/flips-closed-black.png',
  'https://www.blendernation.com/wp-content/uploads/2015/10/Braun_1.jpg',
  'https://cdn.bmstores.co.uk/images/hpcProductImage/imgFull/339164-tower-3-in-1-hand-blender-3.jpg',
  'https://www.samstores.com/media/products/27840/750X750/breville-bsb530-all-in-one-immersion-hand-blender-110-volts-.jpg',
  'https://www.braunhousehold.com/WebImage/Global/product-images/Food-Preparation/hand-blenders/MQ9037X/Hero-image-mq-9037X-yd_800x600.png',
  'https://n4.sdlcdn.com/imgs/a/6/r/Sigma-Multicolor-Plastic-Hand-Blender-SDL726755613-1-0e47f.jpg',
  'https://www.joyceshomecentre.ie/wp-content/uploads/2016/12/Jamoji-Speaker-Crazy-Emoji.jpg',
  'https://cdn3.volusion.com/pxkqg.zxwvc/v/vspfiles/photos/Sinister-Crazy-8s-2.jpg',
  'https://www.laserco.com.au/image/cache/data/product_images/SPK-F340/floor-speaker-12-x-2-60w-led-lights-karaoke-usb-bt-fm-radio-mp3-playback-repack-2057-500x500.jpg',
  'https://www.crazyspeaker.de/out/pictures/generated/product/1/665_665_100/l387990a.jpg',
  'https://i.pinimg.com/originals/7f/24/37/7f24372c14b9a85c848ef51bb872e80d.jpg',
  'https://www.crazyspeaker.de/out/pictures/master/product/7/nl_408_112.jpg',
  'https://content.abt.com/image.php/4-VR2AK9350WK.jpg?image=/images/products/BDP_Images/4-VR2AK9350WK.jpg&canvas=1&quality=100&min_w=450&min_h=320&ck=436',
  'https://pic.made-in-china.com/4f0j00EeBtZCGPYicI/Robotic-Vacuum-Cleaner-QQ2.jpg',
  'https://image-us.samsung.com/SamsungUS/home/home-appliances/vaccums/robot/pd/vr1am7010uw/gallery1/09_VR1AM7010UW-AA_009_Dynamic_White.jpg?$product-details-jpg$',
  'https://media.eastcoasthardware.com/media/catalog/product/6/0/602869_size_2_newsize_2000.jpg',
  'https://www.robotshop.com/community/uploads/j/m/jmichaud/imported/makita-drc200z-industrial-robotic-vacuum_2.png',
  'https://c1.neweggimages.com/NeweggImage/ProductImage/A5E6_131696594595432639KrA8sQgtp5.jpg',
  'https://www.nationalproductreview.com/wp-content/uploads/woocommerce_products/1221.jpg',
  'https://wetailstore.com/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f/i/m/image1_1_20.jpg',
  'https://www.evogadgets.com/image/evogadgetsmarketing/image/data/all_product_images/product-299/Omega-White.jpg',
  'https://s3-assets.sylvane.com/media/images/products/neato-botvac-d80-robot-vacuum-main.png',
  'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fresource.electrolux.com.au%2FPublic%2FImage2%2Fproduct%2F103995%2F33552%2FEC-ProductCarousel%2Frobotic-vacuums_pi91-5sgm_hero-1.png&f=1&nofb=1',
  'https://www.gizmochina.com/wp-content/uploads/2018/03/Original-Xiaomi-Mi-Robot-Vacuum-1st-Generation_2.jpg',
  'https://ae01.alicdn.com/kf/HTB1AYbdDY1YBuNjSszeq6yblFXax/PHOREAL-FR-T-New-Product-Robotic-Vacuum-Cleaner-with-HD-Camera-Navigation-Monitoring-function-robot-vacuum.jpg',
];

async function addFakeProducts() {
  for (let i = 0; i < 100; i++) {
    try {
      await db.query(
        `
    INSERT INTO products (
        name, byline, description, image_url, price, quantity, net_weight, rating, discount)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)   
    `,
        [
          faker.commerce.productName(),
          `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`,
          faker.commerce.productDescription(),
          productImages[i % productImages.length],
          faker.commerce.price(),
          Math.floor(Math.random() * 50) + 10,
          Math.random() * 30 + 1,
          Math.floor(Math.random() * 5) + 1,
          Math.floor(Math.random() * 2) ? 0 : Math.abs(Math.random() - 0.5),
        ]
      );
    } catch (error) {
      console.log(error);
    }
  }

  await db.end();

  console.log('Done!');
}

addFakeProducts();
