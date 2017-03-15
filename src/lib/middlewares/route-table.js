import { expressConfig } from '../../config';

export default (req, res, next) => {
  const origin = `https://${expressConfig.domainName}`;
  res.status(200).json({
    restaurants: `${origin}/restaurants`,
    restaurant: `${origin}/restaurant{/restaurantId}`,
    dishes: `${origin}/restaurant{/restaurantId}/dishes`,
    dish: `${origin}/restaurant{/restaurantId}/dish{/dishId}`
  });
};
