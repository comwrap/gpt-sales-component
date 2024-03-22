# GPT Sales Component

The GSC is a frontend component developed in conjunction with the Adobe App Builder application. It creates a sales module based on data from Adobe Commerce Product Recommendations.

Adobe Commerce Product Recommendations offer an extensive range of suggestions, driven by behavioral data, product attribute data, and metrics. Why not leverage this valuable data to construct content pages or blocks using GPT AI for content generation and validation? GPT can ensure that the content aligns with defined requirements and goals.

App Builder application is generating Marketing content based on Magento Products metadata and provide Frontend API to use this content for publishing it on Frontend.


### Workflow for Frontend component:

1) Render dropdown with list of available product reco units. To get list of product reco units need call app builder action "getRecommendationsList"

Request body:

`{"storeViewCode":"magento_store_code"}` storeCode - required field

Example response:

```
{
  "results": [
    {
      "createdAt": "2022-04-19T12:17:06.058Z",
      "displayNumber": 4,
      "displayOrder": 1,
      "environmentId": "",
      "exclusions": null,
      "filterRules": [],
      "mageId": "",
      "metrics": [],
      "pagePlacement": "below-main-content",
      "pageType": "Product",
      "storeViewCode": "de",
      "storefrontLabel": "Das könnte dich auch interessieren",
      "typeId": "more-like-this",
      "unitId": "",
      "unitName": "Das könnte dich auch interessieren",
      "unitStatus": "Active",
      "updatedAt": "2023-12-19T14:23:16.053Z"
    },
    {
      "createdAt": "2023-11-29T15:44:15.722Z",
      "displayNumber": 6,
      "displayOrder": 1,
      "environmentId": "",
      "exclusions": null,
      "filterRules": [
        {
          ...
        }
      ],
      "mageId": "",
      "metrics": [
        ...
      ],
      "pagePlacement": "below-main-content",
      "pageType": "CMS",
      "storeViewCode": "de",
      "storefrontLabel": "Test product reco",
      "typeId": "most-added-to-cart",
      "unitId": "",
      "unitName": "Test",
      "unitStatus": "Active",
      "updatedAt": "2023-11-29T15:44:15.738Z"
    }
  ],
  "total": 4
}
```

"unitId" - it's unique ID of product reco unit. Should be

2) Publish (save) component config to app builder

Example body:

```
{
    "uuid":"string" //required if it's update action, optional for create
    "store_code":"string" //required, adobe commerce store code
    "product_recommendations_unit": "string" //required, unitId value
    "sku":"string|null", //optional, if not null, then sku from here will be used instead of getting product sku from product recommendation 
    "content_type_uid": "int",
    "delivery_content":
    [
        "image",
        "description",
        "short_description",
        "features_list",
        "price"
    ],
    "enable_auto_switch": boolean,
    "enable_auto_validation": boolean,
    "sku": string
    "sales_target":
    {
        "days": int,
        "qty": int
    },
    
}
```