const fakeDatabase = [
  {
    name: '紅成小館',
    location: {
      address: '光棚尾端左側',
      coordinates: {
        lat: 25.0561558,
        lng: 121.6120222
      }
    },
    priceRange: {
      from: 30,
      to: 130
    },
    menu: [
      {
        name: '綜合海鮮粥',
        price: 120,
        tags: ['粥類', '海鮮']
      },
      {
        name: '泡菜綜合海鮮粥',
        price: 130,
        tags: ['粥類', '海鮮']
      },
      {
        name: '無刺魚肚粥',
        price: 120,
        tags: ['粥類', '海鮮']
      },
      {
        name: '鮮蚵粥',
        price: 70,
        tags: ['粥類', '海鮮']
      },
      {
        name: '香菇肉粥',
        price: 55,
        tags: ['粥類']
      },
      {
        name: '綜合海鮮麵',
        price: 120,
        tags: ['麵類', '海鮮']
      },
      {
        name: '泡菜綜合海鮮麵',
        price: 120,
        tags: ['麵類', '海鮮']
      },
      {
        name: '客家鹹湯圓',
        price: 55,
        tags: []
      },
      {
        name: '泡菜五花肉飯',
        price: 90,
        tags: ['飯類']
      },
      {
        name: '控肉便當',
        price: 75,
        tags: ['飯類', '豬肉']
      },
      {
        name: '雞腿便當',
        price: 75,
        tags: ['飯類', '雞肉']
      },
      {
        name: '台南米糕便當',
        price: 70,
        tags: ['飯類']
      },
      {
        name: '魚鬆肉燥便當',
        price: 70,
        tags: ['飯類']
      },
      {
        name: '台南米糕',
        price: 35,
        tags: ['飯類']
      },
      {
        name: '魚鬆肉燥飯',
        price: 30,
        tags: ['飯類']
      },
      {
        name: '無刺魚肚湯',
        price: 110,
        tags: ['湯類', '海鮮']
      },
      {
        name: '蚵仔湯',
        price: 55,
        tags: ['湯類', '海鮮']
      },
      {
        name: '蛤仔湯',
        price: 50,
        tags: ['湯類', '海鮮']
      },
      {
        name: '虱目魚丸湯',
        price: 30,
        tags: ['湯類', '海鮮']
      },
      {
        name: '韓國泡菜',
        price: 30,
        tags: ['小菜']
      },
      {
        name: '滷白菜',
        price: 30,
        tags: ['小菜']
      },
      {
        name: '滷蛋',
        price: 10,
        tags: ['小菜']
      },
      {
        name: '豆干',
        price: 10,
        tags: ['小菜']
      }
    ]
  },
  {
    name: '甘泉魚麵',
    location: {
      address: '光棚入口右側',
      coordinates: {
        lat: 25.0561558,
        lng: 121.6120222
      }
    },
    priceRange: {
      from: 100,
      to: 240
    },
    menu: [
      {
        name: '招牌甘泉魚麵',
        price: 125,
        tags: ['麵類', '海鮮']
      },
      {
        name: '釜山泡菜炙麵',
        price: 125,
        tags: ['麵類']
      },
      {
        name: '茄汁牛肉片麵',
        price: 120,
        tags: ['麵類', '牛肉']
      },
      {
        name: '肉骨茶豬肉片麵',
        price: 125,
        tags: ['麵類', '豬肉']
      }
    ]
  }
];

export const getRestaurants = (req, res, next) => {
  res.status(200).json(fakeDatabase);
};
