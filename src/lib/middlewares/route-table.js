import { expressConfig } from '../../config';

export default (req, res, next) => {
  const origin = `https://${expressConfig.domainName}`;
  res.status(200).json({
    restaurants: `${origin}/restaurants`,
    restaurant: `${origin}/restaurants{/restaurantId}`,
    dishes: `${origin}/restaurants{/restaurantId}/dishes`,
    dish: `${origin}/restaurants{/restaurantId}/dishes{/dishId}`
  });
};
