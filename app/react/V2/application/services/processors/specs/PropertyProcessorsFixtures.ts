import { Entity } from "app/V2/domain";
import { ProcessingContext } from "../types";
import { ComposedTemplate, DateMetadataProperty, MultiDateMetadataProperty } from "app/V2/domain/entities/types";
import { EntitySchema } from "api/migrations/migrations/143-parse-numeric-fields/types";

export const rawEntity: EntitySchema = {
    "_id": "68dded72c9474e23bb5e9254",
    "language": "en",
    "mongoLanguage": "en",
    "sharedId": "36l0vr92qce",
    "title": "Full entity",
    "template": "68ddecdbc9474e23bb5e914b",
    "published": false,
    "creationDate": 1759374706197,
    "editDate": 1760366924144,
    "metadata": {
        "text_label": [
            {
                "value": "Text1"
            }
        ],
        "markdown": [
            {
                "value": "# A first-level heading\n## A second-level heading\n### A third-level heading\n"
            }
        ],
        "date": [
            {
                "value": 1759363200
            }
        ],
        "geolocationisolated_geolocation": [
            {
                "value": {
                    "lat": 46.3964365565104,
                    "lon": 3.6694335937500004,
                    "label": ""
                }
            }
        ],
        "multidate": [
            {
                "value": 1759276800
            },
            {
                "value": 1759363200
            },
            {
                "value": 1759449600
            }
        ],
        "daterange": [
            {
                "value": {
                    "from": 1759276800,
                    "to": 1761955199
                }
            }
        ],
        "multidaterange": [
            {
                "value": {
                    "from": 1759276800,
                    "to": 1759449599
                }
            },
            {
                "value": {
                    "from": 1759363200,
                    "to": 1759535999
                }
            }
        ],
        "select": [
            {
                "value": "9e22a1af-75d7-49a2-b9d8-9ec77939b630",
                "label": "Again"
            }
        ],
        "multiselect": [
            {
                "value": "765ab6ca-56a1-4948-9dc9-17fc0aa30843",
                "label": "Acknowledging"
            },
            {
                "value": "9e22a1af-75d7-49a2-b9d8-9ec77939b630",
                "label": "Again"
            },
            {
                "value": "8c418311-1244-4777-800a-65729b8c17a8",
                "label": "verb2",
                "parent": {
                    "value": "68979984-35ac-4b98-abf9-28eac857749c",
                    "label": "grouped"
                }
            },
            {
                "value": "e1b9944b-43ef-4989-837b-b3df79284b00",
                "label": "verb1",
                "parent": {
                    "value": "68979984-35ac-4b98-abf9-28eac857749c",
                    "label": "grouped"
                }
            }
        ],
        "relationship": [
            {
                "value": "xjku67dv7b",
                "label": "Context trimming sample2",
                "icon": {
                    "_id": "ECU",
                    "label": "Ecuador",
                    "type": "Flags"
                },
                "type": "entity",
                "inheritedValue": [
                    {
                        "value": "9e22a1af-75d7-49a2-b9d8-9ec77939b630",
                        "label": "Again"
                    },
                    {
                        "value": "765ab6ca-56a1-4948-9dc9-17fc0aa30843",
                        "label": "Acknowledging"
                    }
                ],
                "inheritedType": "multiselect"
            },
            {
                "value": "4oklamamet",
                "label": "Context trimming sample3",
                "icon": "",
                "type": "entity",
                "inheritedValue": [],
                "inheritedType": "multiselect"
            }
        ],
        "relationship1": [
            {
                "value": "xjku67dv7b",
                "label": "Context trimming sample2",
                "icon": {
                    "_id": "ECU",
                    "label": "Ecuador",
                    "type": "Flags"
                },
                "type": "entity"
            },
            {
                "value": "4oklamamet",
                "label": "Context trimming sample3",
                "icon": "",
                "type": "entity"
            }
        ],
        "link": [
            {
                "value": {
                    "label": "google",
                    "url": "www.google.com"
                }
            }
        ],
        "image": [
            {
                "value": "/api/files/17593747059321ygqk22fdos.png"
            }
        ],
        "preview": [
            {
                "value": ""
            }
        ],
        "media": [
            {
                "value": "(/api/files/1759374705932xi5rx0mumef.mp4, {\"timelinks\":{\"00:20:15\":\"control\",\"01:30:45\":\"Test timelink\"}})"
            }
        ],
        "geolocation_geolocation": [
            {
                "value": {
                    "lat": 44.33301685687683,
                    "lon": 5.998535156250001,
                    "label": ""
                }
            }
        ],
        "geolocation2_geolocation": [
            {
                "value": {
                    "lat": 62.58069554111894,
                    "lon": 15.468750000000002,
                    "label": ""
                }
            }
        ],
        "geolocationr": [
            {
                "value": "xjku67dv7b",
                "label": "Context trimming sample2",
                "icon": {
                    "_id": "ECU",
                    "label": "Ecuador",
                    "type": "Flags"
                },
                "type": "entity",
                "inheritedValue": [
                    {
                        "value": {
                            "lat": 43.80157978110818,
                            "lon": 7.492675781250001,
                            "label": ""
                        }
                    }
                ],
                "inheritedType": "geolocation"
            },
            {
                "value": "4oklamamet",
                "label": "Context trimming sample3",
                "icon": "",
                "type": "entity",
                "inheritedValue": [],
                "inheritedType": "geolocation"
            }
        ],
        "generatedid": [
            {
                "value": "BDZ3505-3650"
            }
        ],
        "relationship_n-3": [
            {
                "value": "6qdshinfobf",
                "label": "Middle1",
                "icon": "",
                "type": "entity",
                "inheritedValue": [
                    {
                        "value": "7jdr88mnow6",
                        "label": "EL1",
                        "icon": "",
                        "type": "entity",
                        "inheritedValue": [
                            {
                                "value": "xjku67dv7b",
                                "label": "Context trimming sample2",
                                "icon": {
                                    "_id": "ECU",
                                    "label": "Ecuador",
                                    "type": "Flags"
                                },
                                "type": "entity",
                                "inheritedValue": [
                                    {
                                        "value": "9e22a1af-75d7-49a2-b9d8-9ec77939b630",
                                        "label": "Again"
                                    },
                                    {
                                        "value": "765ab6ca-56a1-4948-9dc9-17fc0aa30843",
                                        "label": "Acknowledging"
                                    }
                                ],
                                "inheritedType": "multiselect"
                            }
                        ],
                        "inheritedType": "relationship"
                    }
                ],
                "inheritedType": "relationship"
            }
        ]
    },
    "user": "58ada34d299e82674854510f",
    "permissions": [
        {
            "refId": "58ada34d299e82674854510f",
            "type": "user",
            "level": "write"
        }
    ],
    "obsoleteMetadata": [],
    "__v": 11
};

const formattedMetadata: ComposedTemplate = {
    _id: '1',
    name: 'template1',
    label: 'Template 1',
    color: '#00000',
};

const failedOutput = {
    "_id": "68dded72c9474e23bb5e9254",
    "title": "Full entity",
    "metadata": [
        {
            "value": [
                {
                    "value": "Text1"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e914c",
            "name": "text_label",
            "label": "Text Label",
            "type": "text",
            "translatedLabel": "Text Label",
            "index": 0,
            "values": [
                {
                    "value": "Text1",
                    "label": "Text1",
                    "displayValue": "Text1"
                }
            ]
        },
        {
            "value": [
                {
                    "value": "# A first-level heading\n## A second-level heading\n### A third-level heading\n"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e914d",
            "name": "markdown",
            "label": "Markdown",
            "type": "markdown",
            "translatedLabel": "Markdown",
            "index": 1,
            "values": [
                {
                    "value": "# A first-level heading\n## A second-level heading\n### A third-level heading\n",
                    "label": "# A first-level heading\n## A second-level heading\n### A third-level heading\n",
                    "displayValue": "# A first-level heading\n## A second-level heading\n### A third-level heading\n"
                }
            ]
        },
        {
            "value": [
                {
                    "value": 1759363200
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e914e",
            "name": "date",
            "label": "Date",
            "type": "date",
            "translatedLabel": "Date",
            "index": 2,
            "values": [
                {
                    "value": 1759363200,
                    "formattedValue": "2025-10-02",
                    "localizedValue": "Oct 2, 2025",
                    "displayValue": "Oct 2, 2025",
                    "label": "2025-10-02",
                    "dateObject": "2025-10-02T00:00:00.000Z"
                }
            ]
        },
        {
            "value": [
                {
                    "value": {
                        "lat": 46.3964365565104,
                        "lon": 3.6694335937500004,
                        "label": ""
                    }
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68e5e13b192fccdd10036334",
            "name": "geolocationisolated_geolocation",
            "label": "GeolocationIsolated",
            "type": "geolocation",
            "translatedLabel": "GeolocationIsolated",
            "index": 3,
            "values": [
                {
                    "value": {
                        "value": {
                            "lat": 46.3964365565104,
                            "lon": 3.6694335937500004,
                            "label": ""
                        }
                    },
                    "label": "Invalid coordinates",
                    "displayValue": "Invalid coordinates",
                    "error": "Invalid coordinates"
                }
            ]
        },
        {
            "value": [
                {
                    "value": 1759276800
                },
                {
                    "value": 1759363200
                },
                {
                    "value": 1759449600
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e914f",
            "name": "multidate",
            "label": "Multidate",
            "type": "multidate",
            "translatedLabel": "Multidate",
            "index": 4,
            "values": [
                {
                    "value": 1759276800,
                    "formattedValue": "2025-10-01",
                    "localizedValue": "Oct 1, 2025",
                    "displayValue": "Oct 1, 2025",
                    "label": "2025-10-01",
                    "dateObject": "2025-10-01T00:00:00.000Z"
                },
                {
                    "value": 1759363200,
                    "formattedValue": "2025-10-02",
                    "localizedValue": "Oct 2, 2025",
                    "displayValue": "Oct 2, 2025",
                    "label": "2025-10-02",
                    "dateObject": "2025-10-02T00:00:00.000Z"
                },
                {
                    "value": 1759449600,
                    "formattedValue": "2025-10-03",
                    "localizedValue": "Oct 3, 2025",
                    "displayValue": "Oct 3, 2025",
                    "label": "2025-10-03",
                    "dateObject": "2025-10-03T00:00:00.000Z"
                }
            ]
        },
        {
            "value": [
                {
                    "value": {
                        "from": 1759276800,
                        "to": 1761955199
                    }
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e9150",
            "name": "daterange",
            "label": "Daterange",
            "type": "daterange",
            "translatedLabel": "Daterange",
            "index": 5,
            "values": [
                {
                    "value": {
                        "from": 1759276800,
                        "to": 1761955199
                    },
                    "formattedValue": {
                        "from": "2025-10-01",
                        "to": "2025-10-31"
                    },
                    "localizedValue": {
                        "from": "Oct 1, 2025",
                        "to": "Oct 31, 2025"
                    },
                    "displayValue": {
                        "from": "Oct 1, 2025",
                        "to": "Oct 31, 2025"
                    },
                    "dateObject": {
                        "from": "2025-10-01T00:00:00.000Z",
                        "to": "2025-10-31T23:59:59.000Z"
                    }
                }
            ]
        },
        {
            "value": [
                {
                    "value": {
                        "from": 1759276800,
                        "to": 1759449599
                    }
                },
                {
                    "value": {
                        "from": 1759363200,
                        "to": 1759535999
                    }
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68e56b29192fccdd10035c2a",
            "name": "multidaterange",
            "label": "Multidaterange",
            "type": "multidaterange",
            "translatedLabel": "Multidaterange",
            "index": 6,
            "values": [
                {
                    "value": {
                        "from": 1759276800,
                        "to": 1759449599
                    },
                    "formattedValue": {
                        "from": "2025-10-01",
                        "to": "2025-10-02"
                    },
                    "localizedValue": {
                        "from": "Oct 1, 2025",
                        "to": "Oct 2, 2025"
                    },
                    "displayValue": {
                        "from": "Oct 1, 2025",
                        "to": "Oct 2, 2025"
                    },
                    "dateObject": {
                        "from": "2025-10-01T00:00:00.000Z",
                        "to": "2025-10-02T23:59:59.000Z"
                    }
                },
                {
                    "value": {
                        "from": 1759363200,
                        "to": 1759535999
                    },
                    "formattedValue": {
                        "from": "2025-10-02",
                        "to": "2025-10-03"
                    },
                    "localizedValue": {
                        "from": "Oct 2, 2025",
                        "to": "Oct 3, 2025"
                    },
                    "displayValue": {
                        "from": "Oct 2, 2025",
                        "to": "Oct 3, 2025"
                    },
                    "dateObject": {
                        "from": "2025-10-02T00:00:00.000Z",
                        "to": "2025-10-03T23:59:59.000Z"
                    }
                }
            ]
        },
        {
            "value": [
                {
                    "value": {
                        "lat": 44.33301685687683,
                        "lon": 5.998535156250001,
                        "label": ""
                    }
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e9158",
            "name": "geolocation_geolocation",
            "label": "Geolocation",
            "type": "geolocation",
            "translatedLabel": "Geolocation",
            "index": 15,
            "values": [
                {
                    "value": {
                        "value": {
                            "lat": 44.33301685687683,
                            "lon": 5.998535156250001,
                            "label": ""
                        }
                    },
                    "label": "Invalid coordinates",
                    "displayValue": "Invalid coordinates",
                    "error": "Invalid coordinates"
                }
            ]
        },
        {
            "value": [
                {
                    "value": {
                        "lat": 62.58069554111894,
                        "lon": 15.468750000000002,
                        "label": ""
                    }
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68e5e0d9192fccdd100361d3",
            "name": "geolocation2_geolocation",
            "label": "Geolocation2",
            "type": "geolocation",
            "translatedLabel": "Geolocation2",
            "index": 16,
            "values": [
                {
                    "value": {
                        "value": {
                            "lat": 62.58069554111894,
                            "lon": 15.468750000000002,
                            "label": ""
                        }
                    },
                    "label": "Invalid coordinates",
                    "displayValue": "Invalid coordinates",
                    "error": "Invalid coordinates"
                }
            ]
        },
        {
            "value": [
                {
                    "value": "xjku67dv7b",
                    "label": "Context trimming sample2",
                    "icon": {
                        "_id": "ECU",
                        "label": "Ecuador",
                        "type": "Flags"
                    },
                    "type": "entity",
                    "inheritedValue": [
                        {
                            "value": "9e22a1af-75d7-49a2-b9d8-9ec77939b630",
                            "label": "Again"
                        },
                        {
                            "value": "765ab6ca-56a1-4948-9dc9-17fc0aa30843",
                            "label": "Acknowledging"
                        }
                    ],
                    "inheritedType": "multiselect"
                },
                {
                    "value": "4oklamamet",
                    "label": "Context trimming sample3",
                    "icon": null,
                    "type": "entity",
                    "inheritedValue": [],
                    "inheritedType": "multiselect"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e9153",
            "name": "relationship",
            "label": "Relationship",
            "type": "relationship",
            "translatedLabel": "Relationship",
            "index": 9,
            "values": [
                {
                    "value": "xjku67dv7b",
                    "label": "Context trimming sample2",
                    "url": "#",
                    "icon": {
                        "_id": "ECU",
                        "label": "Ecuador",
                        "type": "Flags"
                    }
                },
                {
                    "value": "4oklamamet",
                    "label": "Context trimming sample3",
                    "url": "#",
                    "icon": ""
                }
            ],
            "inherited": false,
            "properties": {}
        },
        {
            "value": [
                {
                    "value": "xjku67dv7b",
                    "label": "Context trimming sample2",
                    "icon": {
                        "_id": "ECU",
                        "label": "Ecuador",
                        "type": "Flags"
                    },
                    "type": "entity"
                },
                {
                    "value": "4oklamamet",
                    "label": "Context trimming sample3",
                    "icon": null,
                    "type": "entity"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68e585e4192fccdd10035da9",
            "name": "relationship1",
            "label": "Relationship1",
            "type": "relationship",
            "translatedLabel": "Relationship1",
            "index": 10,
            "values": [
                {
                    "value": "xjku67dv7b",
                    "label": "Context trimming sample2",
                    "url": "#",
                    "icon": {
                        "_id": "ECU",
                        "label": "Ecuador",
                        "type": "Flags"
                    }
                },
                {
                    "value": "4oklamamet",
                    "label": "Context trimming sample3",
                    "url": "#",
                    "icon": ""
                }
            ],
            "inherited": false,
            "properties": {}
        },
        {
            "value": [
                {
                    "value": {
                        "label": "google",
                        "url": "www.google.com"
                    }
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e9154",
            "name": "link",
            "label": "Link",
            "type": "link",
            "translatedLabel": "Link",
            "index": 11,
            "values": [
                {
                    "value": {
                        "label": "google",
                        "url": "www.google.com"
                    },
                    "label": "google",
                    "displayValue": "google"
                }
            ]
        },
        {
            "value": [
                {
                    "value": "/api/files/17593747059321ygqk22fdos.png"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e9155",
            "name": "image",
            "label": "Image",
            "type": "image",
            "translatedLabel": "Image",
            "index": 12,
            "values": [
                {
                    "value": {
                        "value": "/api/files/17593747059321ygqk22fdos.png"
                    },
                    "label": "Unknown",
                    "displayValue": "Unknown",
                    "formattedValue": {
                        "fileName": "Unknown",
                        "url": "",
                        "type": "unknown",
                        "style": "default",
                        "label": "Unknown"
                    }
                }
            ]
        },
        {
            "value": [
                {
                    "value": ""
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e9156",
            "name": "preview",
            "label": "Preview",
            "type": "preview",
            "translatedLabel": "Preview",
            "index": 13,
            "values": [
                {
                    "value": "",
                    "label": "[object Object]",
                    "displayValue": "[object Object]"
                }
            ]
        },
        {
            "value": [
                {
                    "value": "(/api/files/1759374705932xi5rx0mumef.mp4, {\"timelinks\":{\"00:20:15\":\"control\",\"01:30:45\":\"Test timelink\"}})"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e9157",
            "name": "media",
            "label": "Media",
            "type": "media",
            "translatedLabel": "Media",
            "index": 14,
            "values": [
                {
                    "value": "/api/files/1759374705932xi5rx0mumef.mp4",
                    "label": "1759374705932xi5rx0mumef.mp4",
                    "displayValue": "1759374705932xi5rx0mumef.mp4",
                    "url": "/api/files/1759374705932xi5rx0mumef.mp4",
                    "mimetype": "video/mp4",
                    "size": 0,
                    "duration": 0,
                    "dimensions": null,
                    "thumbnail": null,
                    "selected": true,
                    "filename": "1759374705932xi5rx0mumef.mp4",
                    "originalname": "1759374705932xi5rx0mumef.mp4",
                    "fileType": "video",
                    "index": 0,
                    "timelinks": {
                        "00:20:15": "control",
                        "01:30:45": "Test timelink"
                    }
                }
            ],
            "timelines": [],
            "mediaFiles": [
                {
                    "value": "/api/files/1759374705932xi5rx0mumef.mp4",
                    "label": "1759374705932xi5rx0mumef.mp4",
                    "displayValue": "1759374705932xi5rx0mumef.mp4",
                    "url": "/api/files/1759374705932xi5rx0mumef.mp4",
                    "mimetype": "video/mp4",
                    "size": 0,
                    "duration": 0,
                    "dimensions": null,
                    "thumbnail": null,
                    "selected": true,
                    "filename": "1759374705932xi5rx0mumef.mp4",
                    "originalname": "1759374705932xi5rx0mumef.mp4",
                    "fileType": "video",
                    "index": 0,
                    "timelinks": {
                        "00:20:15": "control",
                        "01:30:45": "Test timelink"
                    }
                }
            ],
            "fileMetadata": {
                "totalSize": 0,
                "totalDuration": 0,
                "fileTypes": [
                    "video"
                ],
                "timelineCount": 0
            }
        },
        {
            "value": [
                {
                    "value": "xjku67dv7b",
                    "label": "Context trimming sample2",
                    "icon": {
                        "_id": "ECU",
                        "label": "Ecuador",
                        "type": "Flags"
                    },
                    "type": "entity",
                    "inheritedValue": [
                        {
                            "value": {
                                "lat": 43.80157978110818,
                                "lon": 7.492675781250001,
                                "label": ""
                            }
                        }
                    ],
                    "inheritedType": "geolocation"
                },
                {
                    "value": "4oklamamet",
                    "label": "Context trimming sample3",
                    "icon": null,
                    "type": "entity",
                    "inheritedValue": [],
                    "inheritedType": "geolocation"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68e5e119192fccdd100362cb",
            "name": "geolocationr",
            "label": "GeolocationR",
            "type": "relationship",
            "translatedLabel": "GeolocationR",
            "index": 17,
            "values": [
                {
                    "value": "xjku67dv7b",
                    "label": "Context trimming sample2",
                    "url": "#",
                    "icon": {
                        "_id": "ECU",
                        "label": "Ecuador",
                        "type": "Flags"
                    }
                },
                {
                    "value": "4oklamamet",
                    "label": "Context trimming sample3",
                    "url": "#",
                    "icon": ""
                }
            ],
            "inherited": false,
            "properties": {}
        },
        {
            "value": [
                {
                    "value": "6qdshinfobf",
                    "label": "Middle1",
                    "icon": null,
                    "inheritedValue": [],
                    "inheritedType": "relationship"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ec57cf80a3354966fb29db",
            "name": "relationship_nested",
            "label": "Relationship Nested",
            "type": "relationship",
            "translatedLabel": "Relationship Nested",
            "index": 18,
            "values": [
                {
                    "value": "6qdshinfobf",
                    "label": "Middle1",
                    "url": "#",
                    "icon": ""
                }
            ],
            "inherited": false,
            "properties": {}
        },
        {
            "value": [
                {
                    "value": "BDZ3505-3650"
                }
            ],
            "_entityId": "68dded72c9474e23bb5e9254",
            "_id": "68ddecdbc9474e23bb5e9159",
            "name": "generatedid",
            "label": "Generatedid",
            "type": "generatedid",
            "translatedLabel": "Generatedid",
            "index": 19,
            "values": [
                {
                    "value": "BDZ3505-3650",
                    "label": "BDZ3505-3650",
                    "displayValue": "BDZ3505-3650"
                }
            ]
        }
    ],
    "creationDate": {
        "value": 1759374706197,
        "formattedValue": "57722-05-14",
        "localizedValue": "May 14, 57722",
        "displayValue": "May 14, 57722",
        "label": "57722-05-14",
        "dateObject": "+057722-05-14T04:09:57.000Z"
    },
    "editDate": {
        "value": 1760320591458,
        "formattedValue": "57752-05-03",
        "localizedValue": "May 3, 57752",
        "displayValue": "May 3, 57752",
        "label": "57752-05-03",
        "dateObject": "+057752-05-03T22:04:18.000Z"
    },
    "template": {
        "_id": "68ddecdbc9474e23bb5e914b",
        "name": "Full template",
        "label": "Full template",
        "color": "#C03B22",
        "entityViewPage": ""
    }
}

const creationDate: DateMetadataProperty = {
    name: "creationDate",
    type: "date",
    label: 'creationDate',
    translatedLabel: 'creationDate',
    values: [{ value: 1759374706197, label: 'Oct 2, 2025' }],
    dateObject: new Date('2025-10-02T04:09:57.000Z'),
};

const editDate: DateMetadataProperty = {
    name: "editDate",
    type: "date",
    label: 'editDate',
    translatedLabel: 'editDate',
    values: [{ value: 1760320591458, label: 'Oct 3, 2025' }],
    dateObject: new Date('2025-10-03T22:04:18.000Z'),
};

export const singleDateProperty: DateMetadataProperty = {
    name: "single_date",
    type: "date",
    label: 'Single date',
    translatedLabel: 'Single date',
    values: [{ value: 1662380774900, label: 'Oct 2, 2025' }],
    dateObject: new Date('2025-10-02T04:09:57.000Z'),
};

const multipleDateProperty: MultiDateMetadataProperty = {
    name: "multiple_date",
    type: "multidate",
    label: 'Multiple dates',
    translatedLabel: 'Multiple dates',
    values: [{ value: 1662380774900, label: 'Oct 2, 2025' }, { value: 1664982774900, label: 'Oct 3, 2025' }, { value: 1667588374900, label: 'Oct 4, 2025' }],
    dateObject: [new Date('2025-10-02T04:09:57.000Z'), new Date('2025-10-03T22:04:18.000Z'), new Date('2025-10-04T04:09:57.000Z')],
};

const entity: Entity = {
    _id: '68dded72c9474e23bb5e9254',
    title: 'Full entity',
    sharedId: '36l0vr92qce',
    language: 'en',
    creationDate: creationDate,
    editDate: editDate,
    icon: { _id: 'SMR' },
    template: formattedMetadata,
    metadata: [
        singleDateProperty,
        multipleDateProperty,
        {
            name: 'date_range',
            label: 'Single date range',
            type: 'daterange',
            values: [{ value: { from: 1662380774900, to: 1662985574900 } }],
        },
        {
            name: 'multi_range',
            label: 'Multiple date ranges',
            type: 'multidaterange',
            values: [
                { value: { from: 1662380774900, to: 1662985574900 } },
                { value: { from: 1664982774900, to: 1665673974900 } },
                { value: { from: 1667588374900, to: 1668193174900 } },
            ],
        },
        {
            name: 'location_of_interes',
            label: 'Location of interest',
            type: 'geolocation',
            values: [{ value: { latitude: 44, longitude: 26 } }],
        },
        {
            name: 'related_people',
            label: 'Related people',
            type: 'relationship',
            inherited: false,
            relationshipName: 'People related to event',
            values: [
                { value: 'entityShared1', label: 'Person 1', icon: '', url: '/entity/entityShared1' },
                { value: 'entityShared2', label: 'Perons 2', icon: '', url: '/entity/entityShared2' },
            ],
            properties: {
                template: {
                    _id: '2',
                    name: 'template2',
                    label: 'Template 2',
                    color: '#11011',
                },
            },
        },
        {
            name: 'nearby_incidents',
            label: 'Nearby incidents',
            type: 'relationship',
            inherited: true,
            relationshipName: 'Incident nearby',
            values: [
                { value: 'incident1', label: 'Incident at 40°N, 22°E', url: '/entity/incident1' },
                { value: 'incident2', label: 'Incident at 46°N, 26°E', url: '/entity/incident2' },
            ],
            properties: {
                template: {
                    _id: '3',
                    name: 'template3',
                    label: 'Template 3',
                    color: '#1AE15',
                },
                inheritedProperty: {
                    type: 'geolocation',
                    name: 'place_of_incident',
                    label: 'Location of incident',
                },
            },
        },
        {
            name: 'video_of_event',
            label: 'Media file',
            type: 'media',
            values: [{ value: '/short-video.mp4', alt: 'Alternative text' }],
        },
        {
            name: 'selected_image',
            label: 'An Image',
            type: 'image',
            values: [{ value: '/short-video-thumbnail.jpg', alt: 'Alternative text for image' }],
        },
        {
            type: 'preview',
            label: 'Preview of main document',
            name: 'preview_document',
            values: [{ value: '/batman.jpg', alt: 'Alternative text pdf preview' }],
        },
        {
            type: 'text',
            label: 'Simple text',
            name: 'simple_text',
            values: [{ value: 'Sample simple text' }],
        },
        {
            type: 'markdown',
            label: 'Markdown (HTML example)',
            name: 'markdown_html',
            values: [
                {
                    value:
                        '<p>This <b>Markdown</b> field includes <i>simple HTML</i> tags and a <a href="https://example.com">link</a>.</p>',
                },
            ],
        },
        {
            type: 'markdown',
            label: 'Markdown (syntax example)',
            name: 'markdown_syntax',
            values: [
                {
                    value: '**Bold text**, *italic text*, and a [link](https://example.com)',
                },
            ],
        },
    ],
};


export const processingContext: ProcessingContext = {
    "includeTemplate": true,
    "includeMetadata": true,
    "includeRelationships": false,
    "includeFiles": false,
    "includeNavigation": false,
    "includePermissions": true,
    "onlyForCards": true,
    "dateFormat": "MMM D, YYYY",
    "translateLabels": true,
    "language": "en",
    "translations": [
        {
            "locale": "en",
            "contexts": [
                {
                    "id": "5bfbb1a0471dd0fc16ada146",
                    "label": "Document",
                    "type": "Entity",
                    "values": {
                        "Document": "Document EN",
                        "Date": "Date",
                        "Title": "Title",
                        "Multiselect": "Multiselect",
                        "Markdown": "Markdown",
                        "Multiselect from text": "Multiselect from text",
                        "GeolocationD": "GeolocationD"
                    }
                },
                {
                    "id": "68d6ed4891b591b7432b276b",
                    "label": "Verbs",
                    "type": "Thesaurus",
                    "values": {
                        "Verbs": "Verbs",
                        "Acknowledging": "Acknowledging",
                        "Again": "Again",
                        "Citing": "Citing",
                        "Confirming": "Confirming",
                        "Emphasizing": "Emphasizing",
                        "Expressing": "Expressing",
                        "Guided by": "Guided by",
                        "Noting": "Noting",
                        "Observing": "Observing",
                        "Reaffirming": "Reaffirming",
                        "Recalling": "Recalling",
                        "Recognizing": "Recognizing",
                        "Referring To": "Referring To",
                        "Stating": "Stating",
                        "Taking Into Account": "Taking Into Account",
                        "Taking note": "Taking note",
                        "Underscoring": "Underscoring",
                        "Urges": "Urges",
                        "Welcomes": "Welcomes",
                        "Welcoming": "Welcoming",
                        "grouped": "grouped",
                        "verb1": "verb1",
                        "verb2": "verb2"
                    }
                },
                {
                    "id": "68da997861bceda4fe0d6d25",
                    "label": "TextDocument",
                    "type": "Entity",
                    "values": {
                        "Numeric": "Numeric",
                        "Markdown": "Markdown",
                        "TextDocument": "TextDocument",
                        "Title": "Title",
                        "Multiselect": "Multiselect"
                    }
                },
                {
                    "id": "68da99b961bceda4fe0d6ddd",
                    "label": "related from",
                    "type": "Connection",
                    "values": {
                        "related from": "related from"
                    }
                },
                {
                    "id": "68da99d961bceda4fe0d6e0f",
                    "label": "related to",
                    "type": "Relationship Type",
                    "values": {
                        "related to": "related to"
                    }
                },
                {
                    "id": "68ddecdbc9474e23bb5e914b",
                    "label": "Full template",
                    "type": "Entity",
                    "values": {
                        "Text Label": "Text Label",
                        "Markdown": "Markdown",
                        "Date": "Date",
                        "Multidate": "Multidate",
                        "Daterange": "Daterange",
                        "Select": "Select",
                        "Multiselect": "Multiselect",
                        "Relationship": "Relationship",
                        "Link": "Link",
                        "Image": "Image",
                        "Preview": "Preview",
                        "Media": "Media",
                        "Geolocation": "Geolocation",
                        "Generatedid": "Generatedid",
                        "Full template": "Full template",
                        "Title": "Title",
                        "Multidaterange": "Multidaterange",
                        "Relationship1": "Relationship1",
                        "Geolocation2": "Geolocation2",
                        "GeolocationR": "GeolocationR",
                        "GeolocationIsolated": "GeolocationIsolated",
                        "Relationship n-3": "Relationship n-3"
                    }
                },
                {
                    "id": "68ec577980a3354966fb293c",
                    "label": "middle",
                    "type": "Entity",
                    "values": {
                        "middle": "middle",
                        "Title": "Title",
                        "Relationship n-2": "Relationship n-2"
                    }
                },
                {
                    "id": "68ec5bf780a3354966fb2c25",
                    "label": "extra level",
                    "type": "Entity",
                    "values": {
                        "extra level": "extra level",
                        "Title": "Title",
                        "Relationship n-1": "Relationship n-1"
                    }
                }
            ]
        },
    ],
    "templates": [
        {
            "_id": "5bfbb1a0471dd0fc16ada146",
            "name": "Document",
            "commonProperties": [
                {
                    "_id": "5bfbb1a0471dd0fc16ada148",
                    "label": "Title",
                    "name": "title",
                    "isCommonProperty": true,
                    "type": "text",
                    "prioritySorting": false
                },
                {
                    "_id": "5bfbb1a0471dd0fc16ada147",
                    "label": "Date added",
                    "name": "creationDate",
                    "isCommonProperty": true,
                    "type": "date",
                    "prioritySorting": false
                },
                {
                    "_id": "68da9640ea8d8c69971bf274",
                    "label": "Date modified",
                    "name": "editDate",
                    "type": "date",
                    "isCommonProperty": true
                }
            ],
            "properties": [
                {
                    "_id": "68d56f072489957bf47a600b",
                    "type": "date",
                    "label": "Date",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "date"
                },
                {
                    "content": "68d6ed4891b591b7432b276b",
                    "_id": "68d6f62891b591b7432b2b4b",
                    "type": "multiselect",
                    "label": "Multiselect",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "multiselect"
                },
                {
                    "_id": "68da993261bceda4fe0d6c49",
                    "type": "markdown",
                    "label": "Markdown",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "markdown"
                },
                {
                    "content": "68d6ed4891b591b7432b276b",
                    "_id": "68daaa5561bceda4fe1014d8",
                    "type": "multiselect",
                    "label": "Multiselect from text",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "multiselect_from_text"
                },
                {
                    "_id": "68e5e0eb192fccdd1003624b",
                    "type": "geolocation",
                    "label": "GeolocationD",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "geolocationd_geolocation"
                }
            ],
            "__v": 8,
            "default": false,
            "color": "#16bdca",
            "entityViewPage": ""
        },
        {
            "_id": "68da997861bceda4fe0d6d25",
            "color": "#C03B22",
            "properties": [
                {
                    "_id": "68da997861bceda4fe0d6d26",
                    "type": "numeric",
                    "label": "Numeric",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "numeric"
                },
                {
                    "_id": "68da997861bceda4fe0d6d27",
                    "type": "markdown",
                    "label": "Markdown",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "markdown"
                },
                {
                    "content": "68d6ed4891b591b7432b276b",
                    "_id": "68da999561bceda4fe0d6da6",
                    "type": "multiselect",
                    "label": "Multiselect",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "multiselect"
                }
            ],
            "commonProperties": [
                {
                    "_id": "68da997861bceda4fe0d6d28",
                    "label": "Title",
                    "name": "title",
                    "type": "text",
                    "isCommonProperty": true
                },
                {
                    "_id": "68da997861bceda4fe0d6d29",
                    "label": "Date added",
                    "name": "creationDate",
                    "type": "date",
                    "isCommonProperty": true
                },
                {
                    "_id": "68da997861bceda4fe0d6d2a",
                    "label": "Date modified",
                    "name": "editDate",
                    "type": "date",
                    "isCommonProperty": true
                }
            ],
            "entityViewPage": "",
            "name": "TextDocument",
            "__v": 2,
            "default": true
        },
        {
            "_id": "68ddecdbc9474e23bb5e914b",
            "color": "#C03B22",
            "properties": [
                {
                    "_id": "68ddecdbc9474e23bb5e914c",
                    "type": "text",
                    "label": "Text Label",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "text_label"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e914d",
                    "type": "markdown",
                    "label": "Markdown",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "markdown"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e914e",
                    "type": "date",
                    "label": "Date",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "date"
                },
                {
                    "_id": "68e5e13b192fccdd10036334",
                    "type": "geolocation",
                    "label": "GeolocationIsolated",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "geolocationisolated_geolocation"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e914f",
                    "type": "multidate",
                    "label": "Multidate",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "multidate"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e9150",
                    "type": "daterange",
                    "label": "Daterange",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "daterange"
                },
                {
                    "_id": "68e56b29192fccdd10035c2a",
                    "type": "multidaterange",
                    "label": "Multidaterange",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "multidaterange"
                },
                {
                    "content": "68d6ed4891b591b7432b276b",
                    "_id": "68ddecdbc9474e23bb5e9151",
                    "type": "select",
                    "label": "Select",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "select"
                },
                {
                    "content": "68d6ed4891b591b7432b276b",
                    "_id": "68ddecdbc9474e23bb5e9152",
                    "type": "multiselect",
                    "label": "Multiselect",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "multiselect"
                },
                {
                    "content": "5bfbb1a0471dd0fc16ada146",
                    "_id": "68ddecdbc9474e23bb5e9153",
                    "type": "relationship",
                    "label": "Relationship",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "relationType": "68da99b961bceda4fe0d6ddd",
                    "inherit": {
                        "property": "68d6f62891b591b7432b2b4b",
                        "type": "multiselect"
                    },
                    "generatedId": false,
                    "name": "relationship"
                },
                {
                    "content": "5bfbb1a0471dd0fc16ada146",
                    "_id": "68e585e4192fccdd10035da9",
                    "type": "relationship",
                    "label": "Relationship1",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "relationType": "68da99b961bceda4fe0d6ddd",
                    "generatedId": false,
                    "name": "relationship1"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e9154",
                    "type": "link",
                    "label": "Link",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "link"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e9155",
                    "type": "image",
                    "label": "Image",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "fill",
                    "generatedId": false,
                    "name": "image"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e9156",
                    "type": "preview",
                    "label": "Preview",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "fill",
                    "generatedId": false,
                    "name": "preview"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e9157",
                    "type": "media",
                    "label": "Media",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "media"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e9158",
                    "type": "geolocation",
                    "label": "Geolocation",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "geolocation_geolocation"
                },
                {
                    "_id": "68e5e0d9192fccdd100361d3",
                    "type": "geolocation",
                    "label": "Geolocation2",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "geolocation2_geolocation"
                },
                {
                    "content": "5bfbb1a0471dd0fc16ada146",
                    "_id": "68e5e119192fccdd100362cb",
                    "type": "relationship",
                    "label": "GeolocationR",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "relationType": "68da99b961bceda4fe0d6ddd",
                    "inherit": {
                        "property": "68e5e0eb192fccdd1003624b",
                        "type": "geolocation"
                    },
                    "generatedId": false,
                    "name": "geolocationr"
                },
                {
                    "_id": "68ddecdbc9474e23bb5e9159",
                    "type": "generatedid",
                    "label": "Generatedid",
                    "noLabel": false,
                    "required": false,
                    "showInCard": false,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "generatedId": false,
                    "name": "generatedid"
                },
                {
                    "content": "68ec577980a3354966fb293c",
                    "_id": "68ed110f2bbc3dca9918f4bc",
                    "type": "relationship",
                    "label": "Relationship n-3",
                    "noLabel": false,
                    "required": false,
                    "showInCard": true,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "relationType": "68da99b961bceda4fe0d6ddd",
                    "inherit": {
                        "property": "68ec57a480a3354966fb2971",
                        "type": "relationship"
                    },
                    "generatedId": false,
                    "name": "relationship_n-3"
                }
            ],
            "commonProperties": [
                {
                    "_id": "68ddecdbc9474e23bb5e915a",
                    "label": "Title",
                    "name": "title",
                    "type": "text",
                    "isCommonProperty": true
                },
                {
                    "_id": "68ddecdbc9474e23bb5e915b",
                    "label": "Date added",
                    "name": "creationDate",
                    "type": "date",
                    "isCommonProperty": true
                },
                {
                    "_id": "68ddecdbc9474e23bb5e915c",
                    "label": "Date modified",
                    "name": "editDate",
                    "type": "date",
                    "isCommonProperty": true
                }
            ],
            "entityViewPage": "",
            "name": "Full template",
            "__v": 10
        },
        {
            "_id": "68ec577980a3354966fb293c",
            "color": "#C03B22",
            "properties": [
                {
                    "content": "68ec5bf780a3354966fb2c25",
                    "_id": "68ec57a480a3354966fb2971",
                    "type": "relationship",
                    "label": "Relationship n-2",
                    "noLabel": false,
                    "required": false,
                    "showInCard": true,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "relationType": "68da99b961bceda4fe0d6ddd",
                    "inherit": {
                        "property": "68ed10e32bbc3dca9918f3c7",
                        "type": "relationship"
                    },
                    "generatedId": false,
                    "name": "relationship_n-2"
                }
            ],
            "commonProperties": [
                {
                    "_id": "68ec577980a3354966fb293d",
                    "label": "Title",
                    "name": "title",
                    "type": "text",
                    "isCommonProperty": true
                },
                {
                    "_id": "68ec577980a3354966fb293e",
                    "label": "Date added",
                    "name": "creationDate",
                    "type": "date",
                    "isCommonProperty": true
                },
                {
                    "_id": "68ec577980a3354966fb293f",
                    "label": "Date modified",
                    "name": "editDate",
                    "type": "date",
                    "isCommonProperty": true
                }
            ],
            "entityViewPage": "",
            "name": "middle",
            "__v": 4
        },
        {
            "_id": "68ec5bf780a3354966fb2c25",
            "color": "#C03B22",
            "properties": [
                {
                    "content": "5bfbb1a0471dd0fc16ada146",
                    "_id": "68ed10e32bbc3dca9918f3c7",
                    "type": "relationship",
                    "label": "Relationship n-1",
                    "noLabel": false,
                    "required": false,
                    "showInCard": true,
                    "filter": false,
                    "defaultfilter": false,
                    "prioritySorting": false,
                    "style": "",
                    "relationType": "68da99b961bceda4fe0d6ddd",
                    "inherit": {
                        "property": "68d6f62891b591b7432b2b4b",
                        "type": "multiselect"
                    },
                    "generatedId": false,
                    "name": "relationship_n-1"
                }
            ],
            "commonProperties": [
                {
                    "_id": "68ec5bf780a3354966fb2c27",
                    "label": "Title",
                    "name": "title",
                    "type": "text",
                    "isCommonProperty": true
                },
                {
                    "_id": "68ec5bf780a3354966fb2c28",
                    "label": "Date added",
                    "name": "creationDate",
                    "type": "date",
                    "isCommonProperty": true
                },
                {
                    "_id": "68ec5bf780a3354966fb2c29",
                    "label": "Date modified",
                    "name": "editDate",
                    "type": "date",
                    "isCommonProperty": true
                }
            ],
            "entityViewPage": "",
            "name": "extra level",
            "__v": 2
        }
    ],
    "settings": {
        "_id": "58ad7d240d44252fee4e6213",
        "site_name": "Uwazi",
        "filters": [],
        "links": [],
        "languages": [
            {
                "_id": "58ad7d240d44252fee4e6214",
                "default": true,
                "label": "English",
                "key": "en",
                "localized_label": "English"
            },
            {
                "_id": "68d5a6ecb35c48bcf414c57e",
                "label": "Russian",
                "key": "ru",
                "ISO639_3": "rus",
                "elastic": "russian",
                "ISO639_1": "ru",
                "localized_label": "Русский",
                "translationAvailable": true
            },
            {
                "_id": "68d5a6f4b35c48bcf414cd27",
                "label": "Spanish",
                "key": "es",
                "ISO639_3": "spa",
                "elastic": "spanish",
                "ISO639_1": "es",
                "localized_label": "Español",
                "translationAvailable": true
            },
            {
                "_id": "68d5a80eb35c48bcf414d6b7",
                "label": "Greek",
                "key": "el",
                "ISO639_3": "ell",
                "elastic": "greek",
                "ISO639_1": "el",
                "localized_label": "Ελληνικά",
                "translationAvailable": false
            }
        ],
        "__v": 5,
        "newNameGeneration": true,
        "private": false,
        "mapLayers": [
            "Streets",
            "Hybrid",
            "Satellite"
        ],
        "allowcustomJS": false,
        "allowedPublicTemplates": [
            "68d16b182afcebbf30e6fa53"
        ],
        "analyticsTrackingId": "",
        "contactEmail": "",
        "cookiepolicy": false,
        "dateFormat": "yyyy/MM/dd",
        "defaultLibraryView": "cards",
        "favicon": "",
        "home_page": "",
        "mapApiKey": "",
        "mapStartingPoint": [
            {
                "lon": 6,
                "lat": 46
            }
        ],
        "matomoConfig": "",
        "openPublicEndpoint": false,
        "publicFormDestination": "",
        "senderEmail": "",
        "tilesProvider": "mapbox",
        "features": {
            "paragraphExtraction": true,
            "metadata-extraction": true,
            "metadataExtraction": {
                "url": "http://127.0.0.1:5056"
            },
            "segmentation": {
                "url": "http://127.0.0.1:5051/async_extraction"
            }
        }
    },
    "thesauri": [
        {
            "_id": "68d6ed4891b591b7432b276b",
            "name": "Verbs",
            "values": [
                {
                    "label": "Acknowledging",
                    "id": "765ab6ca-56a1-4948-9dc9-17fc0aa30843"
                },
                {
                    "label": "Again",
                    "id": "9e22a1af-75d7-49a2-b9d8-9ec77939b630"
                },
                {
                    "label": "Citing",
                    "id": "7a6987aa-2fd5-4ef2-a2d2-c6b1bee1e7c1"
                },
                {
                    "label": "Confirming",
                    "id": "240c244f-a736-4ad4-b777-e690e3ff78f0"
                },
                {
                    "label": "Emphasizing",
                    "id": "ff786d5a-3c27-4e61-9de1-0aa07e7137cb"
                },
                {
                    "label": "Expressing",
                    "id": "6c744926-bf38-4f98-8c74-cf6b7280863c"
                },
                {
                    "label": "Guided by",
                    "id": "fe08f3ab-3928-4ffe-b8a5-50f4fcd7dba0"
                },
                {
                    "label": "Noting",
                    "id": "d2f9f479-fe15-4f2a-b8bc-df7c6de9e8cf"
                },
                {
                    "label": "Observing",
                    "id": "a3937116-403f-4a50-a5ae-f14270bab534"
                },
                {
                    "label": "Reaffirming",
                    "id": "7665dca1-b5a5-47bf-89ca-a490d1881004"
                },
                {
                    "label": "Recalling",
                    "id": "2a482a0a-974b-4c75-b27e-ba07c6277914"
                },
                {
                    "label": "Recognizing",
                    "id": "ab14667e-2abc-431d-a175-dc69c385b90c"
                },
                {
                    "label": "Referring To",
                    "id": "3c0a6efc-af76-416e-8324-8c2b6daea3ca"
                },
                {
                    "label": "Stating",
                    "id": "f0890323-b160-409f-9fd8-8756e2586831"
                },
                {
                    "label": "Taking Into Account",
                    "id": "c0d8c83c-9843-48ac-8681-880a1ad3a68d"
                },
                {
                    "label": "Taking note",
                    "id": "e5352747-5748-4b9c-b26b-f18f9992f899"
                },
                {
                    "label": "Underscoring",
                    "id": "8d8ee550-1d79-433a-bd73-d74f1ffd5567"
                },
                {
                    "label": "Urges",
                    "id": "e1bc413c-384b-4b3b-a4f2-a4c1dffd6ba7"
                },
                {
                    "label": "Welcomes",
                    "id": "98e5835e-af4a-49b2-840c-b5446360beff"
                },
                {
                    "label": "Welcoming",
                    "id": "33f9f9de-30a7-4271-b4f6-289312d0a446"
                },
                {
                    "label": "grouped",
                    "values": [
                        {
                            "label": "verb1",
                            "id": "e1b9944b-43ef-4989-837b-b3df79284b00"
                        },
                        {
                            "label": "verb2",
                            "id": "8c418311-1244-4777-800a-65729b8c17a8"
                        }
                    ],
                    "id": "68979984-35ac-4b98-abf9-28eac857749c"
                }
            ],
            "__v": 6
        }
    ],
    "currentUser": {
        "_id": "58ada34d299e82674854510f",
        "username": "admin",
        "email": "admin@uwazi.com",
        "__v": 1,
        "role": "admin",
        "groups": []
    }
};