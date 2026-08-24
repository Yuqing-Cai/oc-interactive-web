import type {
  AxisDefinition,
  DomainSelection,
  GenerationMode,
  LocalizedText,
} from "./schema";

export const AXIS_CONNECTIONS = {
  "zh": "\n轴与轴的联动规则（重要！）：\n• W（世界）→ C（抉择）：世界越残酷，抉择越痛\n• B（身体）→ T（时间）：凡人身体 + 非人对象 = 天然寿命差\n• P（力量）→ X（代价）：力量量级决定代价的量级\n• R（立场）→ D（权力）：社会位置影响关系中的权力起点\n• M（动机）→ C（抉择）：动机驱动抉择方向，除非被爱动摇\n• E（表达）+ J（共情）→ 沟通模式：E 是输出，J 是输入，错配产生误会\n• S（心智）→ E + J：心智状态限制表达和共情的稳定性\n• D（权力）← R（立场）+ H（她的位置）：三方共同决定权力格局\n• L（关系认知）+ A（软肋）→ 关系深度：他的弱点在不在你手里\n• H（她的位置）→ D（权力）+ L（关系认知）：她的能动性影响权力和认知进化\n• T（时间）+ F（终局）→ 叙事弧线：时间压力如何导向终局\n• X（代价）↔ M（动机）：代价必须与动机呼应\n",
  "en": "\nAxis Linkage Rules (Important!):\n• W (World) → C (Choice): Crueler world = more painful choices\n• B (Body) → T (Time): Mortal body + non-human partner = built-in lifespan gap\n• P (Power) → X (Cost): Power scale determines cost magnitude\n• R (Role) → D (Dynamic): Social position shapes starting power balance\n• M (Motive) → C (Choice): Motive drives choice direction, unless love intervenes\n• E (Expression) + J (Judgment) → Communication style: E is output, J is input — mismatch creates misunderstanding\n• S (Sanity) → E + J: Mental state limits expression and empathy stability\n• D (Dynamic) ← R (Role) + H (Heroine): Three-way determination of power dynamics\n• L (Love) + A (Achilles) → Relationship depth: Whether his weakness is in your hands\n• H (Heroine) → D (Dynamic) + L (Love): Her agency reshapes power dynamics and perception evolution\n• T (Time) + F (Finale) → Narrative arc: Time pressure shapes the ending\n• X (Cost) ↔ M (Motive): Cost must echo motive\n"
} as const satisfies LocalizedText;

export const AXES = [
  {
    "id": "world",
    "code": "W",
    "kind": "structure",
    "order": 0,
    "copy": {
      "zh": {
        "label": "W = World（世界）",
        "description": "世界阻力",
        "wisdom": "W 轴（世界）决定故事的外部阻力——世界越严苛，在一起的代价越高。",
        "intro": "故事发生在什么样的世界里，外部阻力是什么。世界类型决定了角色面对的具体压力——是制度的压迫、生存的威胁、还是精神的空虚。任何一种世界类型都可以写得日常化，日常感是叙事选择，不是世界类型。",
        "links": "W → C：世界越残酷，抉择越痛。W1 铁律之笼下的抉择是违规的代价，W2 废墟之野下的抉择是生存的代价。"
      },
      "en": {
        "label": "W = World",
        "description": "External resistance",
        "wisdom": "The W axis (World) sets external resistance — the harsher the world, the higher the cost of being together.",
        "intro": "What kind of world does the story take place in, and what is the external resistance? World type determines the specific pressure the characters face — institutional oppression, survival threats, or spiritual emptiness.",
        "links": "W → C: Crueler world = more painful choices. Under W1 Iron Cage, the choice costs defiance; under W2 Ruined Wastes, it costs survival."
      }
    },
    "options": [
      {
        "id": "W1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "W1 铁律之笼",
            "summary": "朝堂/军队/财阀，制度压过个人",
            "detail": "适用场景：朝堂、军队、财阀、严格等级制度。核心矛盾：个人意志 vs 集体规训。他从出生起就被教育服从，爱上你是他人生中第一次主动违规。最好看的时刻：他在制度面前低头了一辈子，但为了你站了起来。"
          },
          "en": {
            "label": "W1 Iron Cage",
            "summary": "Courts/military/corps — system crushes the individual",
            "detail": "Settings: royal court, military, conglomerate, rigid hierarchy. Core conflict: individual will vs. collective discipline. He was taught to obey from birth — falling for you is his first act of defiance. Best moment: A man who bowed to the system his whole life stands up for the first time, for you."
          }
        }
      },
      {
        "id": "W2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "W2 废墟之野",
            "summary": "末日/战乱/废土，先活下来",
            "detail": "适用场景：末日、战乱、废土、资源匮乏。核心矛盾：生存 vs 情感。每天都可能死掉，爱是奢侈品。最好看的时刻：在极端生存压力下，他仍然把最后一份食物留给你，或者在安全和你之间选了你。"
          },
          "en": {
            "label": "W2 Ruined Wastes",
            "summary": "Apocalypse/war/wasteland — survive first",
            "detail": "Settings: apocalypse, warzone, wasteland, scarce resources. Core conflict: survival vs. emotion. Death is daily; love is a luxury. Best moment: Under extreme survival pressure, he still saves the last food for you, or chooses you over safety."
          }
        }
      },
      {
        "id": "W3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "W3 虚无之海",
            "summary": "物质丰富但精神空洞",
            "detail": "适用场景：现代都市、富裕阶层、后工业社会。核心矛盾：物质富足但精神空洞，活着没有意义。他什么都有但什么都不在乎，你的出现让他第一次觉得某件事是重要的。最好看的时刻：一个对一切无感的人，因为你而有了在乎。"
          },
          "en": {
            "label": "W3 Void Sea",
            "summary": "Material wealth, spiritual emptiness",
            "detail": "Settings: modern city, affluent class, post-industrial society. Core conflict: material abundance but spiritual emptiness — what's the point of being alive? He has everything but cares about nothing. You're the first thing that matters. Best moment: A man numb to everything finally cares about something."
          }
        }
      },
      {
        "id": "W4",
        "order": 3,
        "copy": {
          "zh": {
            "label": "W4 暗面之城",
            "summary": "表面正常，底下有秘密身份",
            "detail": "适用场景：都市奇幻、怪谈、双面人生。核心矛盾：他有一个不能让你知道的秘密身份。白天是普通人，夜晚是猎人/妖/实验体。让你介入他的另一面等于把全部信任交给你。最好看的时刻：你发现了他的秘密，他等着你的反应。"
          },
          "en": {
            "label": "W4 Shadow City",
            "summary": "Normal surface, secret identities beneath",
            "detail": "Settings: urban fantasy, ghost stories, double lives. Core conflict: he has a secret identity you can't know about. Normal by day, hunter/demon/test subject by night. Letting you into his other side means total trust. Best moment: You discover his secret. He waits for your reaction."
          }
        }
      },
      {
        "id": "W5",
        "order": 4,
        "copy": {
          "zh": {
            "label": "W5 未知之境",
            "summary": "星际/异世界，未来不可预测",
            "detail": "适用场景：星际探索、异世界、地下城、未知文明。核心矛盾：未来完全不可预测，你们要一起面对。没有前人经验可以参考，每一步都是赌博。最好看的时刻：在彻底未知的环境里，你们成为彼此唯一确定的事。"
          },
          "en": {
            "label": "W5 Unknown Frontier",
            "summary": "Space/other worlds — future unpredictable",
            "detail": "Settings: interstellar, isekai, dungeons, unknown civilizations. Core conflict: the future is completely unpredictable, you face it together. No prior experience to draw on; every step is a gamble. Best moment: In a completely unknown environment, you become each other's only certainty."
          }
        }
      },
      {
        "id": "W6",
        "order": 5,
        "copy": {
          "zh": {
            "label": "W6 修罗之场",
            "summary": "选秀/商战/竞技，零和博弈",
            "detail": "适用场景：选秀、科举、商战、体育竞技、任何零和博弈。核心矛盾：你们是竞争对手，爱上对方等于可能放弃赢的机会。最好看的时刻：决赛时他可以赢你，但他没有——或者他赢了，然后发现这个胜利毫无意义。"
          },
          "en": {
            "label": "W6 Arena",
            "summary": "Competition/business/sports — zero-sum game",
            "detail": "Settings: talent shows, exams, business wars, sports, any zero-sum game. Core conflict: you're competitors — loving each other means potentially giving up winning. Best moment: In the finals he could beat you, but he didn't — or he won, then realized the victory was meaningless."
          }
        }
      }
    ]
  },
  {
    "id": "body",
    "code": "B",
    "kind": "structure",
    "order": 1,
    "copy": {
      "zh": {
        "label": "B = Body（躯壳）",
        "description": "身体形态",
        "wisdom": "B 轴（身体）决定他的物理形态——能不能被拥抱，会不会衰老，你们能不能共处同一空间。",
        "intro": "他有没有身体？什么样的身体？这决定了你们最基本的互动方式——能不能拥抱，能不能一起吃饭，能不能一起变老。身体形态还会影响时间轴（B1 凡人身体和非人对象搭配时天然存在寿命差）。",
        "links": "B → T：凡人身体 + 非人对象 = 天然存在寿命差。选了 B1 又和非人角色搭配时，T1 几乎是内置的。"
      },
      "en": {
        "label": "B = Body",
        "description": "Physical form",
        "wisdom": "The B axis (Body) determines his physical form — can he be embraced? Will he age? Can you share the same space?",
        "intro": "Does he have a body? What kind? This determines the most basic interaction — can you hug, share a meal, grow old together? Body form also affects the time axis (B1 mortal + non-human partner = built-in lifespan gap).",
        "links": "B → T: Mortal body + non-human partner = built-in lifespan gap. Pairing B1 with a non-human character makes T1 almost automatic."
      }
    },
    "options": [
      {
        "id": "B1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "B1 凡人身体",
            "summary": "会受伤、衰老、死亡",
            "detail": "普通人的肉体——会流血、生病、衰老、死亡。所有牺牲都是不可逆的，受的伤不会自愈，死了就是死了。这意味着他每一次为你挡刀都是拿命在赌。最好看的时刻：一个随时可能死的人，依然选择站在你前面。"
          },
          "en": {
            "label": "B1 Mortal Body",
            "summary": "Bleeds, ages, dies — all sacrifice is irreversible",
            "detail": "An ordinary human body — bleeds, gets sick, ages, dies. Every sacrifice is irreversible; wounds don't self-heal; death is permanent. Every time he shields you, he's betting his life. Best moment: A man who could die any day still stands in front of you."
          }
        }
      },
      {
        "id": "B2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "B2 非人身体",
            "summary": "机械/妖灵/异种，感官有壁垒",
            "detail": "机械体、妖灵、改造人、异种生物。核心问题是感官差异：他可能摸不到你的体温，不知道该用多大力气拥抱你，或者他的身体本身对你来说是危险的。最好看的时刻：他笨拙地学习如何用一副不属于人类的身体来表达温柔。"
          },
          "en": {
            "label": "B2 Non-Human Body",
            "summary": "Mechanical/spirit/alien — sensory barriers",
            "detail": "Mechanical, spirit, modified, alien species. The core issue is sensory barriers: he might not feel your warmth, doesn't know how hard to hug you, or his body itself is dangerous to you. Best moment: He clumsily learns to express tenderness with a body that wasn't made for humans."
          }
        }
      },
      {
        "id": "B3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "B3 超越肉体",
            "summary": "无固定身体，无法被触碰",
            "detail": "没有固定身体——可能是一段代码、一阵风、一个概念、一个系统。他无处不在但无法被触碰，没有可以拥抱的实体。要在一起，要么他找到容器（代价是什么？），要么你放弃肉体（你愿意吗？）。最好看的时刻：一个无形的存在，想方设法让你感受到他的触碰。"
          },
          "en": {
            "label": "B3 Beyond Physical",
            "summary": "No fixed body — everywhere but untouchable",
            "detail": "No fixed body — could be code, wind, a concept, a system. He's everywhere but can't be touched. To be together, either he finds a vessel (at what cost?) or you give up your body (would you?). Best moment: A formless being finds a way to make you feel his touch."
          }
        }
      }
    ]
  },
  {
    "id": "power",
    "code": "P",
    "kind": "structure",
    "order": 2,
    "copy": {
      "zh": {
        "label": "P = Power（力量）",
        "description": "力量量级",
        "wisdom": "P 轴（力量）决定他能为你做到什么程度，以及每次动用力量要付出多大代价。",
        "intro": "他的力量有多强。这决定了三件事：他散发出什么气场，他能为你做到什么程度，以及他动用力量时要付出多大代价。力量的具体类型（智谋、武力、信念）由角色设定自然浮现，这里只定义量级。",
        "links": "P → X：力量越大，代价的量级越高。P1 凡人之力的代价是个人层面的（受伤、失去自由）；P3 造物之权的代价是世界层面的（现实扭曲）。"
      },
      "en": {
        "label": "P = Power",
        "description": "Power scale",
        "wisdom": "The P axis (Power) determines what he can do for you, and what it costs him each time he uses that power.",
        "intro": "How powerful is he. This determines three things: the aura he radiates, what he can do for you, and what it costs when he uses that power. The specific type (cunning, martial, faith) emerges from character design — this axis only defines magnitude.",
        "links": "P → X: Greater power = heavier cost. P1 mortal costs are personal (injury, freedom); P3 godlike costs are existential (reality warps)."
      }
    },
    "options": [
      {
        "id": "P1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "P1 凡人之力",
            "summary": "强但在规则内，救人有限",
            "detail": "他很强，但在世界规则框架之内。能帮你挡子弹、黑掉监控、从危险中把你救出来，但无法改变让你陷入险境的制度或命运本身。他不是不想救你，是真的做不到。限制让故事有张力——解决问题要靠智慧和牺牲，不能靠碾压。"
          },
          "en": {
            "label": "P1 Mortal Strength",
            "summary": "Strong but within the rules — limited saves",
            "detail": "Strong, but within the world's rules. Can stop a bullet, hack surveillance, pull you from danger — but can't change the system or fate that put you there. He doesn't lack the will; he lacks the ability. The limitation creates tension: solutions require wit and sacrifice, not overwhelming force."
          }
        }
      },
      {
        "id": "P2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "P2 规则之上",
            "summary": "能改制度，但有连锁反应",
            "detail": "他是世界的掌权者之一——能修改法律、操控市场、影响局部自然规律。他能为你做到很多普通人做不到的事，但每次动用权力都会引发连锁反应，影响无数其他人的命运。权力越大，每一次使用都是道德考验：为了你，牺牲多少无辜的人是可以接受的？"
          },
          "en": {
            "label": "P2 Above the Rules",
            "summary": "Rewrites systems, but triggers chain reactions",
            "detail": "One of the world's power-holders — can rewrite laws, manipulate markets, bend local causality. He can do things no ordinary person could, but every use of power triggers chain reactions affecting countless others. Greater power = greater moral weight: how many innocents is it acceptable to sacrifice for you?"
          }
        }
      },
      {
        "id": "P3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "P3 造物之权",
            "summary": "接近全能，但会扭曲现实",
            "detail": "他是神，或等同于神。能修改世界底层法则，包括死亡本身。为了不让你死，他可以重写因果律。但代价是世界底层逻辑被篡改后，现实开始出现裂缝——物理定律不稳定、时间线错乱、其他生命无辜受害。全能意味着全责，救你一个人可能毁掉整个世界。"
          },
          "en": {
            "label": "P3 Creator's Authority",
            "summary": "Near-omnipotent, but warps reality",
            "detail": "He is a god, or equivalent. Can rewrite the world's fundamental laws, including death itself. To keep you alive, he can alter causality. But the cost: reality cracks when its base logic is tampered with — physics destabilize, timelines scramble, innocent lives suffer. Omnipotence means total responsibility. Saving you might destroy the world."
          }
        }
      }
    ]
  },
  {
    "id": "role",
    "code": "R",
    "kind": "structure",
    "order": 3,
    "copy": {
      "zh": {
        "label": "R = Role（立场）",
        "description": "与秩序的关系",
        "wisdom": "R 轴（立场）决定他和现有秩序的关系——他是体制的一部分，还是站在体制的对面。",
        "intro": "他跟现有秩序是什么关系。他是体制的守护者、挑战者、还是被体制抛弃的人？这决定了他的社会位置、行为逻辑和与你在一起时的外部压力来源。",
        "links": "R → D：立场天然影响权力结构。秩序守卫者（R1）倾向上位（D1），被抛弃者（R3）倾向下位（D2），但这只是起点，关系中权力会翻转。"
      },
      "en": {
        "label": "R = Role",
        "description": "Relationship with order",
        "wisdom": "The R axis (Role) defines his relationship with the established order — is he part of the system, or against it?",
        "intro": "What is his relationship with the established order? Is he its guardian, its challenger, or someone it discarded? This determines his social position, behavioral logic, and the external pressure of being with you.",
        "links": "R → D: Stance naturally shapes power dynamics. Order guardians (R1) tend toward D1 dominance; outcasts (R3) tend toward D2 submission — but this is just the starting point."
      }
    },
    "options": [
      {
        "id": "R1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "R1 秩序守卫者",
            "summary": "规则的执行者，看他为你破例",
            "detail": "适用角色：圣骑士、大师兄、检察官、军官、族长继承人。他是规则的执行者和化身，一辈子守规矩、讲原则。核心看点：看他为你破例。一个从不违规的人，第一次违规就是因为你——这个反差越大，冲击力越强。"
          },
          "en": {
            "label": "R1 Order Guardian",
            "summary": "Enforcer of rules — watch him break them for you",
            "detail": "Roles: paladin, senior disciple, prosecutor, military officer, clan heir. He is the enforcer and embodiment of rules — a lifetime of discipline and principle. The appeal: watching him break the rules for you. A man who never bends, bending for the first time because of you."
          }
        }
      },
      {
        "id": "R2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "R2 秩序破坏者",
            "summary": "和全世界为敌，但你是例外",
            "detail": "适用角色：魔教教主、反派 BOSS、革命军领袖、犯罪组织首领。他和全世界为敌，但他为你划出了一块安全区。核心看点：他可以对全世界残酷无情，但你是例外。危险在于——你能保证自己永远是例外吗？"
          },
          "en": {
            "label": "R2 Order Breaker",
            "summary": "At war with the world — you're the exception",
            "detail": "Roles: cult leader, villain boss, revolutionary, crime lord. He's at war with the entire world, but he carved out a safe zone for you. The appeal: he can be merciless to everyone else, but you're the exception. The danger: can you be sure you'll always be the exception?"
          }
        }
      },
      {
        "id": "R3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "R3 被秩序抛弃",
            "summary": "被体系丢掉的人，渴望被接纳",
            "detail": "适用角色：废太子、退役士兵、被遗弃的实验体、过期 AI。他曾经属于某个体系，但被抛弃了。身上带着伤痕、不信任感，以及深藏的对被接纳的渴望。核心看点：他不相信任何人，但他开始信你。你要证明你不会像其他人那样丢掉他。"
          },
          "en": {
            "label": "R3 Discarded by Order",
            "summary": "Thrown away by the system — craves acceptance",
            "detail": "Roles: deposed prince, retired soldier, abandoned test subject, deprecated AI. He once belonged to a system that threw him away. He carries scars, distrust, and a buried craving for acceptance. The appeal: he trusts no one, but he's starting to trust you. You have to prove you won't discard him like everyone else."
          }
        }
      }
    ]
  },
  {
    "id": "motive",
    "code": "M",
    "kind": "structure",
    "order": 4,
    "copy": {
      "zh": {
        "label": "M = Motive（动机）",
        "description": "活着的理由",
        "wisdom": "M 轴（动机）决定他为什么活着——这根支柱被爱动摇时，就是核心冲突的起点。",
        "intro": "他为什么活着——是使命、执念、觉醒还是野心？弄清楚这根支柱是什么，你就知道恋爱的核心冲突在哪：当爱上你和这根支柱发生矛盾时，他会怎么选？",
        "links": "M → C：动机驱动抉择。使命型（M1）倾向坚守至击碎（C1），计算型（M4）倾向计算后失灵（C2）。X 轴的代价也必须与动机呼应——他为什么愿意付出这个代价。"
      },
      "en": {
        "label": "M = Motive",
        "description": "Why he's alive",
        "wisdom": "The M axis (Motive) defines why he's alive — when love shakes that pillar, the core conflict begins.",
        "intro": "Why is he alive — mission, obsession, awakening, or ambition? Figure out what this pillar is, and you know where the core conflict lies: when loving you clashes with this pillar, what does he choose?",
        "links": "M → C: Motive drives choice. Mission-driven (M1) tends toward C1 hold-until-shattered; calculating (M4) tends toward C2 logic-failure. X axis cost must also echo motive."
      }
    },
    "options": [
      {
        "id": "M1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "M1 外部使命",
            "summary": "被赋予的任务，从没为自己活过",
            "detail": "他活着是为了完成被赋予的任务：守护苍生、执行审判、保护某个人。他把自己当成工具，从来没考虑过自己想要什么。你的出现让他产生了第一个私人欲望。核心冲突：使命要求他牺牲自己，但你让他第一次想活下来。"
          },
          "en": {
            "label": "M1 External Mission",
            "summary": "Lives for an assigned task — never lived for himself",
            "detail": "He lives to fulfill an assigned task: protect the world, carry out judgment, guard someone. He treats himself as a tool, never considering what he wants. You gave him his first personal desire. Core conflict: the mission demands self-sacrifice, but you made him want to live."
          }
        }
      },
      {
        "id": "M2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "M2 创伤执念",
            "summary": "被过去绑住，没有未来",
            "detail": "他活着是因为被过去绑住了：童年噩梦、未报的仇、无法弥补的过错。他的一切行为都指向过去，没有未来。你的出现让他意识到现在和未来也有意义。核心冲突：他无法放下过去，但你只存在于现在。"
          },
          "en": {
            "label": "M2 Trauma Fixation",
            "summary": "Chained to the past — no future",
            "detail": "He lives because the past won't let go: childhood nightmares, unavenged wrongs, irreparable mistakes. Everything he does points backward; there's no future. You showed him the present and future matter too. Core conflict: he can't release the past, but you only exist in the now."
          }
        }
      },
      {
        "id": "M3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "M3 自发觉醒",
            "summary": "从虚无中自发产生活下去的念头",
            "detail": "他原本没有活着的理由——一张白纸、一个空壳、一台没有目标的机器。然后他突然产生了想要活下去或想要爱你的念头。这个念头没有外部理由，完全自发。核心冲突：这个念头非常珍贵但也非常脆弱，一旦被否定就可能彻底消失。"
          },
          "en": {
            "label": "M3 Spontaneous Awakening",
            "summary": "From nothing, a desire to live suddenly appears",
            "detail": "He had no reason to live — a blank slate, an empty shell, a machine with no objective. Then he suddenly wanted to live, or to love you. No external cause; purely spontaneous. Core conflict: this desire is precious but fragile — deny it once and it might vanish forever."
          }
        }
      },
      {
        "id": "M4",
        "order": 3,
        "copy": {
          "zh": {
            "label": "M4 登顶野心",
            "summary": "追求最强最高，你是唯一的裂缝",
            "detail": "他活着是为了成为最强、最高、最好的。爱上你意味着承认自己有需求——而有需求就意味着不完美。你是他追求完美的道路上唯一的裂缝。核心冲突：选择你就是放弃一部分野心，不选择你就是放弃唯一让他感到人性的东西。"
          },
          "en": {
            "label": "M4 Climb to the Top",
            "summary": "Chasing perfection — you're the only crack",
            "detail": "He lives to be the strongest, highest, best. Loving you means admitting he has needs — and needs mean imperfection. You're the only crack in his pursuit of perfection. Core conflict: choosing you means surrendering part of his ambition; not choosing you means surrendering the only thing that makes him feel human."
          }
        }
      }
    ]
  },
  {
    "id": "choice",
    "code": "C",
    "kind": "structure",
    "order": 5,
    "copy": {
      "zh": {
        "label": "C = Choice（抉择）",
        "description": "被爱动摇时的反应",
        "wisdom": "C 轴（抉择）决定他在使命和你之间必须二选一时会怎么做。",
        "intro": "当他的核心动机（M 轴）因为爱上你而动摇时，他的反应模式是什么。这个轴制造戏剧冲突的能力最强——选不同的抉择方式，故事的高潮完全不同。",
        "links": "C 受 W 和 M 双重驱动：世界（W）定义抉择的难度上限，动机（M）定义他面对抉择时的默认反应。"
      },
      "en": {
        "label": "C = Choice",
        "description": "When love shakes his core",
        "wisdom": "The C axis (Choice) defines what he does when forced to choose between his mission and you.",
        "intro": "When his core motive (M axis) is shaken by love, what is his response pattern? This axis has the strongest dramatic-conflict potential — different choice modes produce entirely different story climaxes.",
        "links": "C is driven by both W and M: World (W) sets the difficulty ceiling; Motive (M) sets his default reaction to the dilemma."
      }
    },
    "options": [
      {
        "id": "C1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "C1 坚守至击碎",
            "summary": "死守底线直到底线碎掉",
            "detail": "他有一条绝对不能越过的底线（道德准则、誓言、信仰）。面对矛盾时他会死扛，拒绝妥协，直到底线被现实一点一点打碎。高潮时刻：他最终不得不违背自己坚守一生的原则——完美人格在爱面前出现裂缝，而这个裂缝是不可修复的。"
          },
          "en": {
            "label": "C1 Hold Until Shattered",
            "summary": "White-knuckles his line until it breaks",
            "detail": "He has an absolute line he will not cross (moral code, oath, faith). Faced with contradiction, he white-knuckles it, refusing compromise, until reality grinds the line to dust. Climax: he's finally forced to violate the principle he held his entire life — a perfect persona cracking under love, irreparably."
          }
        }
      },
      {
        "id": "C2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "C2 计算后失灵",
            "summary": "靠理性决策但算不明白",
            "detail": "他没有道德执念，做所有决定都靠利弊分析。他习惯把一切纳入计算框架，但爱你这件事算不明白——投入和回报的逻辑对不上，风险评估全部失效。高潮时刻：一个永远理性的人，做了一件完全非理性的事，而且他自己也知道这不合理。"
          },
          "en": {
            "label": "C2 Logic Failure",
            "summary": "Rational framework — can't compute love",
            "detail": "He has no moral fixation; every decision runs through cost-benefit analysis. He's used to framing everything rationally, but loving you doesn't compute — ROI doesn't add up, risk assessment breaks. Climax: the perpetually rational man does something completely irrational, and he knows it makes no sense."
          }
        }
      },
      {
        "id": "C3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "C3 无条件选你",
            "summary": "不犹豫直接选你，代价自己扛",
            "detail": "没有犹豫、没有挣扎——你就是他的第一优先级。他会为你做任何事，包括你不希望他做的事。戏剧张力不在于他的内心撕裂，而在于他的无条件忠诚带来的后果：为了保护你杀了不该杀的人，为了留住你困住了你。"
          },
          "en": {
            "label": "C3 Choose You, No Hesitation",
            "summary": "You first, consequences later",
            "detail": "No wavering, no internal struggle — you are his top priority. He'll do anything for you, including things you wish he wouldn't. The tension isn't in his inner conflict but in the consequences of unconditional loyalty: killing someone he shouldn't have to protect you, caging you to keep you."
          }
        }
      }
    ]
  },
  {
    "id": "expression",
    "code": "E",
    "kind": "structure",
    "order": 6,
    "copy": {
      "zh": {
        "label": "E = Expression（表达）",
        "description": "表达感情的方式",
        "wisdom": "E 轴（表达）决定谈恋爱的手感——他用什么方式让你知道他在乎。",
        "intro": "他用什么方式表达感情。这直接决定谈恋爱的日常体验——每天互动是什么手感、什么节奏、什么温度。",
        "links": "E + J = 沟通模式。E 是他怎么输出感情，J 是他怎么接收你的感情。E1 冰山闷骚 + J1 完全不懂 = 双向沟通几乎断裂，需要大量误会剧情推动。S 轴限制表达的稳定性——S3 已崩坏时，任何表达模式都可能随时失控。"
      },
      "en": {
        "label": "E = Expression",
        "description": "How he shows affection",
        "wisdom": "The E axis (Expression) determines the texture of the romance — how he lets you know he cares.",
        "intro": "How does he express affection? This directly determines the day-to-day texture of the romance — what interacting with him feels like, the rhythm, the temperature.",
        "links": "E + J = Communication style. E is emotional output, J is emotional input. E1 stoic + J1 clueless = near-total communication breakdown. S axis limits expression stability."
      }
    },
    "options": [
      {
        "id": "E1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "E1 冰山闷骚",
            "summary": "嘴上不说，行动全是照顾你",
            "detail": "嘴上从来不说喜欢，但行动全是在照顾你。默默帮你解决麻烦，你生病时出现在门口但假装路过，送的东西永远说是顺手买的。核心看点：你终于意识到他一直在默默守护你的那个瞬间——回头看全是他的痕迹。"
          },
          "en": {
            "label": "E1 Stoic Devotion",
            "summary": "Never says it — actions say everything",
            "detail": "Never says he likes you, but every action is taking care of you. Quietly solves your problems; shows up at your door when you're sick but claims he was just passing by; gifts are always 'I happened to see it.' The payoff: the moment you realize he's been silently protecting you all along — looking back, his traces are everywhere."
          }
        }
      },
      {
        "id": "E2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "E2 风流撩拨",
            "summary": "话很会说，但真心难辨",
            "detail": "话很多，很会说，每句话都精准踩在你的心跳上。擅长暧昧、双关、制造紧张感。但因为太会说了，你分不清哪句是真心。核心看点：他不再说漂亮话、而是做了一件笨拙但真诚的事——那一刻你知道他是认真的。"
          },
          "en": {
            "label": "E2 Smooth Charmer",
            "summary": "Every word lands, but which ones are real?",
            "detail": "Talks a lot, says it well, every word lands precisely on your heartbeat. Expert at ambiguity, double meanings, building tension. But because he's too good with words, you can't tell which lines are real. The payoff: he stops saying pretty things and does something clumsy but genuine — that's when you know he means it."
          }
        }
      },
      {
        "id": "E3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "E3 直球懵懂",
            "summary": "喜欢就直说，真诚不过滤",
            "detail": "不懂什么是含蓄，喜欢就直接说、直接做。可能说出让旁人社死的话而毫不自知。每一份感情都是未经过滤的，真诚到让人不知道该怎么接招。核心看点：在所有人都在算计的环境里，他的真诚反而是最有杀伤力的武器。"
          },
          "en": {
            "label": "E3 Blunt Innocent",
            "summary": "Says it straight — sincerity unfiltered",
            "detail": "Doesn't understand subtlety. Likes you? Says it directly, does it directly. Might say things that make bystanders cringe without realizing. Every emotion is unfiltered, sincere to the point of disarming. The payoff: in a world where everyone is calculating, his honesty is the most lethal weapon."
          }
        }
      },
      {
        "id": "E4",
        "order": 3,
        "copy": {
          "zh": {
            "label": "E4 占有标记",
            "summary": "明确宣告你是他的",
            "detail": "会明确宣告你是他的——在公开场合牵你的手、在你身上留下标记、对任何靠近你的人释放敌意。你会获得绝对的安全感，但自由度可能趋近于零。核心看点：你尝试拉开距离时他的反应——是学会放手，还是抓得更紧？"
          },
          "en": {
            "label": "E4 Possessive Claim",
            "summary": "Declares you're his — publicly",
            "detail": "Will explicitly declare you're his — holds your hand in public, leaves marks on you, hostile toward anyone who approaches you. You get absolute security, but your freedom may approach zero. The payoff: when you try to create distance, his reaction — does he learn to let go, or grip tighter?"
          }
        }
      },
      {
        "id": "E5",
        "order": 4,
        "copy": {
          "zh": {
            "label": "E5 照料爹系",
            "summary": "记住你所有习惯，日常照顾",
            "detail": "照顾你的一切——记住你的饮食禁忌、出门前提醒你带伞、生病时守在床边。爱体现在琐碎的日常细节里，润物无声。核心看点：某一天他不在了（出差/受伤/消失），你才发现生活里到处都是他的痕迹，他已经嵌入了你的每一天。"
          },
          "en": {
            "label": "E5 Caretaker",
            "summary": "Remembers every detail of your daily life",
            "detail": "Remembers all your dietary restrictions, reminds you to bring an umbrella, stays at your bedside when you're sick. Love shows up in trivial daily details, quiet and steady. The payoff: one day he's gone (business trip/injured/vanished) and you realize his traces are woven into every corner of your life."
          }
        }
      }
    ]
  },
  {
    "id": "judgment",
    "code": "J",
    "kind": "structure",
    "order": 7,
    "copy": {
      "zh": {
        "label": "J = Judgment（共情）",
        "description": "能不能读懂情绪",
        "wisdom": "J 轴（共情）决定他能不能读懂你的情绪，以及读错时会造成什么后果。",
        "intro": "他能不能理解你的情绪、读懂你的感受。这对非人类角色特别重要，但对人类角色同样适用——有些人天生不擅长处理感情。共情能力和表达方式（E 轴）组合起来决定了你们之间的沟通效率。",
        "links": "J + E = 沟通模式。S 轴影响共情的可靠性：S2 有裂痕时，他可能在清醒时共情正常、崩溃时完全失灵。"
      },
      "en": {
        "label": "J = Judgment (Empathy)",
        "description": "Can he read emotions",
        "wisdom": "The J axis (Judgment) determines whether he can read your emotions, and what happens when he gets it wrong.",
        "intro": "Can he understand your emotions and read your feelings? Especially important for non-human characters, but equally relevant for humans who are naturally bad at processing feelings. Empathy + Expression = your communication efficiency.",
        "links": "J + E = Communication style. S axis affects empathy reliability: at S2 cracked, his empathy works when lucid but fails during breakdown."
      }
    },
    "options": [
      {
        "id": "J1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "J1 完全不懂",
            "summary": "用逻辑处理感情，经常误伤",
            "detail": "他用逻辑处理一切情感问题。你哭了，他的反应是分析原因而不是安慰你。典型台词：'你在流泪——这意味着身体在排出多余水分，我应该给你补水吗？'他不是冷酷，是真的不理解。核心问题：他的好意经常造成误伤，而他不明白自己做错了什么。"
          },
          "en": {
            "label": "J1 Completely Clueless",
            "summary": "Processes feelings with logic — often hurts by accident",
            "detail": "He processes all emotional problems with logic. You're crying; his response is to analyze the cause, not comfort you. Typical line: 'You are crying — this means your body is expelling excess fluid. Should I get you water?' He's not cold; he genuinely doesn't understand. Core issue: his good intentions frequently cause collateral damage, and he doesn't know what he did wrong."
          }
        }
      },
      {
        "id": "J2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "J2 努力学习",
            "summary": "知道自己不懂，在笨拙地学",
            "detail": "他知道自己在情感领域是个文盲，所以在努力补课。偷偷翻资料、观察其他情侣、笨拙地模仿电视剧里的台词。每一次尝试都不太对，但他认真的样子本身就让人心软。核心看点：他从完全不懂到终于做对了一件事的过程——那个进步的瞬间比任何甜言蜜语都动人。"
          },
          "en": {
            "label": "J2 Trying to Learn",
            "summary": "Knows he's clueless — awkwardly studying",
            "detail": "He knows he's emotionally illiterate, so he's studying. Secretly reads guides, observes other couples, awkwardly quotes TV drama lines. Every attempt is slightly off, but the effort itself is endearing. The payoff: the moment he finally gets one thing right — that single step of progress is more moving than any sweet talk."
          }
        }
      },
      {
        "id": "J3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "J3 比人更懂人",
            "summary": "能看穿你没说出口的话",
            "detail": "他对人类情感的理解已经超越了普通人的水平。能看穿你的伪装、读懂你没说出口的话、提前预判你的情绪变化。但这种超常的理解力也带来困扰——他开始质疑人类对感情的定义。典型质问：'你们把多巴胺冲动叫爱情——那我对你的感觉，凭什么不算？'"
          },
          "en": {
            "label": "J3 Understands Better Than Humans",
            "summary": "Reads what you didn't say",
            "detail": "His understanding of human emotion surpasses normal people. He can see through your masks, read what you didn't say, predict your mood shifts. But this superhuman insight also brings its own crisis — he starts questioning humanity's definitions of feelings. Typical challenge: 'You call a dopamine spike love — so why doesn't what I feel for you count?'"
          }
        }
      }
    ]
  },
  {
    "id": "sanity",
    "code": "S",
    "kind": "structure",
    "order": 8,
    "copy": {
      "zh": {
        "label": "S = Sanity（心智）",
        "description": "精神稳定性",
        "wisdom": "S 轴（心智）决定他的精神稳定性——开局时什么状态，遇到你之后怎么变。",
        "intro": "他的精神状态如何。这个轴是动态的——故事开始时的状态和遇到你之后的状态可能完全不同。注意：心智状态会限制表达（E 轴）和共情（J 轴）的稳定性。",
        "links": "S 限制 E 和 J：S3 已崩坏的角色不可能稳定地维持 E2 风流撩拨那样精密的表达方式，也不可能保持 J3 比人更懂人的可靠共情。选择时注意兼容性。"
      },
      "en": {
        "label": "S = Sanity",
        "description": "Mental stability",
        "wisdom": "The S axis (Sanity) sets his mental stability — his state at the start, and how meeting you changes it.",
        "intro": "What is his mental state? This axis is dynamic — his condition at the story's start and after meeting you may be completely different. Note: mental state limits the stability of Expression (E) and Empathy (J).",
        "links": "S limits E and J: An S3 shattered character can't sustain E2 smooth-talker precision or J3 superhuman empathy reliability. Check compatibility."
      }
    },
    "options": [
      {
        "id": "S1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "S1 极稳",
            "summary": "永远冷静，看他什么时候崩",
            "detail": "他是所有人的定心丸——永远冷静、永远可靠、任何情况下都能做出正确判断。但正因为太稳了，看点在于什么东西能让他不稳。核心时刻：当永远冷静的人突然失控（因为你受伤、因为要失去你），冲击力是毁灭性的。"
          },
          "en": {
            "label": "S1 Rock-Solid",
            "summary": "Always calm — the question is what breaks him",
            "detail": "He's everyone's anchor — always calm, always reliable, always making the right call. But because he's so stable, the interesting question is: what can make him unstable? Core moment: when the perpetually composed man suddenly loses control (because you're hurt, because he's about to lose you), the impact is devastating."
          }
        }
      },
      {
        "id": "S2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "S2 有裂痕",
            "summary": "白天撑住，夜晚崩塌",
            "detail": "他知道自己有问题——PTSD、身份危机、某段无法释怀的记忆。白天能维持正常运转，但夜晚会崩塌。你的存在同时是止痛药和痛苦来源：因为你让他放松了防备，裂痕反而更容易暴露。核心挑战：你要在不把自己搭进去的前提下帮他处理这些问题。"
          },
          "en": {
            "label": "S2 Cracked",
            "summary": "Holds it together by day, collapses at night",
            "detail": "He knows he has problems — PTSD, identity crisis, a memory he can't let go. Functions normally by day, collapses at night. Your presence is both painkiller and pain source: because you made him lower his guard, the cracks show more easily. Core challenge: helping him without destroying yourself in the process."
          }
        }
      },
      {
        "id": "S3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "S3 已崩坏",
            "summary": "逻辑混乱，你不确定他看到的是不是你",
            "detail": "他的精神状态已经不正常了——逻辑混乱、可能有幻觉、对现实的感知和普通人完全不同。爱上他是一场赌博：这一秒他温柔地看着你，下一秒他可能把你当成威胁。核心风险：你永远不确定他眼中的你是不是真的你——他可能在和一个不存在的版本的你恋爱。"
          },
          "en": {
            "label": "S3 Shattered",
            "summary": "Already broken — you're never sure what he sees",
            "detail": "His mental state is already abnormal — jumbled logic, possible hallucinations, a perception of reality that doesn't match anyone else's. Loving him is a gamble: one second he's looking at you tenderly, the next he might see you as a threat. Core risk: you're never sure whether the 'you' in his eyes is actually you — he might be in love with a version of you that doesn't exist."
          }
        }
      }
    ]
  },
  {
    "id": "dynamic",
    "code": "D",
    "kind": "structure",
    "order": 9,
    "copy": {
      "zh": {
        "label": "D = Dynamic（权力）",
        "description": "谁在主导关系",
        "wisdom": "D 轴（权力）决定你们之间谁在掌控关系走向，以及这个格局什么时候会翻转。",
        "intro": "你们之间的权力关系——谁在主导、谁在跟随、还是势均力敌。这个格局几乎不可能从头到尾不变，最好看的部分往往是权力翻转的瞬间。D 轴描述的是起始状态。",
        "links": "D 受 R（立场）和 H（她的位置）共同影响。比如 R1 秩序守卫者 + H1 独立对手 = 双方都有实力，权力拉锯最激烈。D 轴描述的是起始状态，故事中一定会翻转。"
      },
      "en": {
        "label": "D = Dynamic (Power Balance)",
        "description": "Who leads the relationship",
        "wisdom": "The D axis (Dynamic) defines who controls the relationship's direction, and when that balance flips.",
        "intro": "The power relationship between you — who leads, who follows, or is it a standoff? This dynamic almost never stays constant; the most compelling moments are often when the power flips. D axis describes the starting state.",
        "links": "D is shaped by R (Role) + H (Heroine). R1 guardian + H1 rival = both have power, maximum tension. D describes starting state — it will flip during the story."
      }
    },
    "options": [
      {
        "id": "D1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "D1 他在上位",
            "summary": "各方面比你强，看他低头",
            "detail": "适用关系：师尊与弟子、帝王与臣民、造物主与被造物。他在各方面都比你强，习惯了掌控一切。核心看点：他低头的时候——一个可以对全世界颐指气使的人，在你面前变得笨拙、不知所措，甚至主动交出控制权。"
          },
          "en": {
            "label": "D1 He Dominates",
            "summary": "Outranks you in every way — watch him bow",
            "detail": "Relationship types: master and disciple, emperor and subject, creator and creation. He outranks you in every way, accustomed to total control. The appeal: watching him bow — a man who commands the world, becoming clumsy and helpless before you, even voluntarily surrendering control."
          }
        }
      },
      {
        "id": "D2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "D2 他在下位",
            "summary": "身份低于你，看他越界",
            "detail": "适用关系：侍卫与主人、下属与上司、保镖与雇主。他的身份低于你，表面上服从、忠诚、安静。核心看点：以下犯上的瞬间——平时温顺的人被逼急了会露出獠牙，那一刻权力关系瞬间翻转。"
          },
          "en": {
            "label": "D2 He Submits",
            "summary": "Status below yours — watch him defy",
            "detail": "Relationship types: guard and master, subordinate and boss, bodyguard and client. His status is below yours; on the surface he's obedient, loyal, quiet. The appeal: the moment of insubordination — the usually docile man pushed to his limit bares his fangs, and the power dynamic flips instantly."
          }
        }
      },
      {
        "id": "D3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "D3 势均力敌",
            "summary": "谁也压不住谁，先动心的输",
            "detail": "适用关系：宿敌、同级同僚、竞争对手。你们在能力和地位上不相上下，谁也压不住谁。核心看点：赢家不是更强的那个，而是先动心的那个——因为动心意味着有了弱点。"
          },
          "en": {
            "label": "D3 Equals",
            "summary": "Neither yields — whoever falls first loses",
            "detail": "Relationship types: nemeses, same-rank colleagues, competitors. You're matched in ability and status; neither can overpower the other. The appeal: the winner isn't the stronger one — it's whoever falls in love first, because love creates a weakness."
          }
        }
      }
    ]
  },
  {
    "id": "love",
    "code": "L",
    "kind": "structure",
    "order": 10,
    "copy": {
      "zh": {
        "label": "L = Love（关系认知）",
        "description": "他对你的认知进化",
        "wisdom": "L 轴（关系认知）描述他对你的认知如何进化——从最初把你当成什么，到最终真正看见你。",
        "intro": "他对你的认知如何从起点进化到终点。每个选项描述一条完整的弧线——他最初把你当成什么，中间经历了什么转变，最终认知变成了什么。选的是弧线，不是一个固定标签。",
        "links": "L + A = 关系深度。L1 猎物→真心 + A2 系于一人 = 他一开始不把你当人，但你偏偏是他的软肋，矛盾最尖锐。H 轴影响 L 轴弧线的推进速度——H1 独立对手会主动推动认知转变，H4 柔软之刃则是被动但深刻地影响他。"
      },
      "en": {
        "label": "L = Love (Perception Arc)",
        "description": "How his perception of you evolves",
        "wisdom": "The L axis (Love) traces how his perception of you evolves — from what he first sees you as, to truly seeing you.",
        "intro": "How his perception of you evolves from start to finish. Each option describes a complete arc — what he first sees you as, what triggers the shift, and what he ultimately recognizes. You're choosing an arc, not a fixed label.",
        "links": "L + A = Relationship depth. L1 prey→devotion + A2 bound to one person = he doesn't see you as human, yet you're his weakness. Maximum contradiction. H axis affects arc speed."
      }
    },
    "options": [
      {
        "id": "L1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "L1 猎物→真心",
            "summary": "从不把你当人到爱上真实的你",
            "detail": "起点：他不把你当人——你是实验对象、棋子、猎物、工具。转折：某个具体事件让他开始把你当人看（你的反抗、你的脆弱、你对他的善意）。终点：他爱上了真实的你。弧线越长、起点越冷酷，转折的冲击力越大。"
          },
          "en": {
            "label": "L1 Prey → Devotion",
            "summary": "From not seeing you as human to loving the real you",
            "detail": "Start: he doesn't see you as a person — you're a test subject, a chess piece, prey, a tool. Turning point: a specific event makes him start seeing you as human (your defiance, your vulnerability, your kindness to him). End: he falls for the real you. The longer the arc and colder the start, the more devastating the turn."
          }
        }
      },
      {
        "id": "L2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "L2 药物→独立",
            "summary": "从依赖你到自由选择留下",
            "detail": "起点：你是他的止痛药、锚点、唯一能让他平静的人。他离不开你，但这本质上是依赖而不是爱。转折：他学会了不依赖你也能存活。终点：在自由的前提下，他选择留在你身边。区别在于——'离不开你'变成了'不需要你但选择你'。"
          },
          "en": {
            "label": "L2 Drug → Independence",
            "summary": "From depending on you to freely choosing you",
            "detail": "Start: you're his painkiller, anchor, the only thing that calms him. He can't function without you, but this is dependency, not love. Turning point: he learns to survive without relying on you. End: free to leave, he chooses to stay. The difference: 'can't leave you' becomes 'don't need you but choose you.'"
          }
        }
      },
      {
        "id": "L3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "L3 影子→放手",
            "summary": "从爱幻影到接受真人",
            "detail": "起点：他爱的不是你，是脑补的完美形象或逝去之人的影子。只要你符合他的想象就一切美好。转折：你展现了真实、不完美的一面（发脾气、犯错、和他想象中的人不一样），他困惑甚至崩溃。终点：他杀死心里那个完美的幻影，接受真实的你。这是最残忍的弧线——他必须先失去一个不存在的人。"
          },
          "en": {
            "label": "L3 Shadow → Release",
            "summary": "From loving a phantom to accepting the real person",
            "detail": "Start: he doesn't love you — he loves an idealized image or a dead person's ghost. As long as you match his fantasy, everything's perfect. Turning point: you show your real, imperfect self (anger, mistakes, being nothing like his imagined version), and he's confused or devastated. End: he kills the perfect phantom in his mind and accepts the real you. The cruelest arc — he must first lose someone who never existed."
          }
        }
      },
      {
        "id": "L4",
        "order": 3,
        "copy": {
          "zh": {
            "label": "L4 劫数→和解",
            "summary": "从抗拒动心到接受脆弱",
            "detail": "起点：你是他完美自控人生里的唯一失控因素。他讨厌自己因你而软弱、分心、做出不理性的决定。转折：持续的内耗——他反复试图切断对你的感情但做不到。终点：他接受了爱让人脆弱不等于让人变弱，不再和自己的感情对抗。这条弧线的看点全在内耗过程。"
          },
          "en": {
            "label": "L4 Curse → Acceptance",
            "summary": "From resenting his feelings to embracing vulnerability",
            "detail": "Start: you're the only uncontrolled variable in his perfectly managed life. He hates himself for going soft, getting distracted, making irrational choices because of you. Turning point: relentless internal struggle — he repeatedly tries to sever his feelings and fails. End: he accepts that love making him vulnerable doesn't make him weaker. All the drama is in the internal war."
          }
        }
      },
      {
        "id": "L5",
        "order": 4,
        "copy": {
          "zh": {
            "label": "L5 始终如一",
            "summary": "从头到尾爱真实的你",
            "detail": "没有进化弧线——他从一开始就看见真实的你，接受你的平庸、缺点和所有不完美。这是最健康的关系认知，但也最考验外部剧情：因为内部没有认知冲突，故事张力必须来自外部阻力（世界、时间、代价）。选这个时建议搭配强外部压力轴（W、T、X）。"
          },
          "en": {
            "label": "L5 Constant",
            "summary": "Sees and loves the real you from the start",
            "detail": "No evolution arc — he sees the real you from the start, accepting your mediocrity, flaws, and all imperfections. The healthiest perception, but the hardest to write dramatically: with no internal perception conflict, all tension must come from external forces (world, time, cost). Recommended pairing: strong external-pressure axes (W, T, X)."
          }
        }
      }
    ]
  },
  {
    "id": "achilles",
    "code": "A",
    "kind": "structure",
    "order": 11,
    "copy": {
      "zh": {
        "label": "A = Achilles（软肋）",
        "description": "致命弱点在哪",
        "wisdom": "A 轴（软肋）是他的致命弱点——按下去他就会失控或崩溃，是推动剧情的关键开关。",
        "intro": "他的致命弱点是什么——按下这个开关，他就会失控、崩溃或暴走。软肋是推动剧情的关键工具：反派可以利用它威胁他，你可以通过守护它表达爱，它也可以在关键时刻成为他做出极端选择的原因。",
        "links": "A + L = 关系深度。他的软肋在不在你手里，取决于 L 轴他把你看成什么。A2 系于一人 + L5 始终如一 = 他从一开始就知道你是他的弱点，并接受了这一点。"
      },
      "en": {
        "label": "A = Achilles (Weakness)",
        "description": "Where his fatal weakness lies",
        "wisdom": "The A axis (Achilles) is his fatal weakness — press it and he loses control or breaks down. The key plot trigger.",
        "intro": "His fatal weakness — hit this switch and he loses control, breaks down, or goes berserk. The weakness is a key plot tool: villains exploit it to threaten him, you protect it to show love, and it can drive his most extreme decisions.",
        "links": "A + L = Relationship depth. Whether his weakness is in your hands depends on L axis perception. A2 bound to one + L5 constant = he always knew you were his weakness and accepted it."
      }
    },
    "options": [
      {
        "id": "A1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "A1 系于一物",
            "summary": "弱点绑在一个具体物品上",
            "detail": "他的弱点绑定在一个具体物品上——一枚戒指、一段代码、一本旧日记、一把钥匙。摧毁这个物品，他就会失去自我或力量。剧情用法：反派抢走它来威胁他，你帮他守住它来表达爱，或者他主动毁掉它来换取某种代价。"
          },
          "en": {
            "label": "A1 Bound to an Object",
            "summary": "Weakness tied to a specific item",
            "detail": "His weakness is tied to a specific item — a ring, a piece of code, an old diary, a key. Destroy the object, and he loses his sense of self or his power. Plot uses: the villain steals it to threaten him; you help guard it to show love; or he destroys it himself to pay a price."
          }
        }
      },
      {
        "id": "A2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "A2 系于一人",
            "summary": "弱点是你，你受伤他就暴走",
            "detail": "他的弱点是你。你受伤了他就暴走，你笑了他就停下毁灭世界的手。这是最浪漫的设定，但也有明确的黑暗面：如果你死了或离开了，没有任何人或任何东西能阻止他。剧情用法：反派通过威胁你来控制他，你用自己的安全作为和他谈判的筹码。"
          },
          "en": {
            "label": "A2 Bound to a Person",
            "summary": "You're his weakness — you're hurt, he snaps",
            "detail": "His weakness is you. You're hurt, he goes berserk. You smile, he stops destroying the world. The most romantic setup, but with a clear dark side: if you die or leave, nothing and no one can stop him. Plot uses: the villain threatens you to control him; you leverage your own safety as a bargaining chip."
          }
        }
      },
      {
        "id": "A3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "A3 系于一念",
            "summary": "弱点是一个信念，被证伪就崩溃",
            "detail": "他的弱点是一个抽象概念——正义、真理、某个承诺、复仇。这个概念支撑着他的全部存在意义。一旦这个概念被证伪（正义不存在、承诺被背叛、仇人其实是无辜的），他的整个世界观会瞬间瓦解。剧情用法：真相揭露后他要么重建自我，要么彻底黑化。"
          },
          "en": {
            "label": "A3 Bound to a Belief",
            "summary": "Weakness is a concept — disprove it, he collapses",
            "detail": "His weakness is an abstract concept — justice, truth, a promise, revenge. This concept is the foundation of his entire existence. Once it's disproven (justice doesn't exist, the promise was betrayed, the enemy was innocent), his entire worldview collapses instantly. Plot uses: after the truth is revealed, he either rebuilds himself or falls into darkness."
          }
        }
      }
    ]
  },
  {
    "id": "heroine",
    "code": "H",
    "kind": "structure",
    "order": 12,
    "copy": {
      "zh": {
        "label": "H = Heroine（她的位置）",
        "description": "女主的能动性",
        "wisdom": "H 轴（她的位置）决定女主在故事里有多大主动权——她不只是被爱的人，她有自己的作用。",
        "intro": "女主在这段关系和这个故事里的角色定位。这决定了她有多大主动权、她如何影响剧情走向、以及她和男主之间的互动模式。H 轴直接影响权力结构（D 轴）和关系认知的进化速度（L 轴）。",
        "links": "H → D：她的能动性直接影响权力格局。H1 独立对手让 D3 势均力敌成为最自然的搭配；H4 柔软之刃让 D1 他在上位产生反差张力。H → L：她越主动，他的关系认知进化越快。"
      },
      "en": {
        "label": "H = Heroine (Her Role)",
        "description": "Her agency in the story",
        "wisdom": "The H axis (Heroine) determines how much agency the female lead has — she's not just the one being loved.",
        "intro": "The female lead's role and position in this relationship and story. This determines how much agency she has, how she affects the plot, and how she interacts with the male lead. H directly influences power dynamics (D) and perception arc speed (L).",
        "links": "H → D: Her agency directly reshapes power dynamics. H1 rival makes D3 equals the natural fit; H4 gentle blade creates contrast tension with D1 dominance. H → L: More agency = faster perception evolution."
      }
    },
    "options": [
      {
        "id": "H1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "H1 独立对手",
            "summary": "有自己的目标和力量，势均力敌",
            "detail": "她有自己的目标、自己的力量、自己的立场，和他势均力敌甚至在某些方面比他强。他们的关系是棋逢对手的碰撞——互相欣赏但也互相较劲，谁先动心谁先暴露弱点。适合搭配 D3 势均力敌。核心看点：两个都不愿低头的人，最终谁先承认自己在乎。"
          },
          "en": {
            "label": "H1 Independent Rival",
            "summary": "Her own goals and power — evenly matched",
            "detail": "She has her own goals, her own strength, her own stance — evenly matched with him, or even stronger in some ways. Their relationship is a collision of equals — mutual admiration mixed with competition. Whoever falls first exposes a weakness. Pairs naturally with D3 Equals. The appeal: two people who refuse to bow, and who finally admits they care."
          }
        }
      },
      {
        "id": "H2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "H2 共生搭档",
            "summary": "各有所长，一起比分开强",
            "detail": "她和他各有所长，合作时互补，缺了谁都不行。比如他擅长战斗但不会判断形势，她擅长分析但没有执行力。关系的核心是合作而不是保护——他们一起比分开强。核心看点：一方暂时缺席时，另一方发现自己有多依赖对方的那个部分。"
          },
          "en": {
            "label": "H2 Symbiotic Partner",
            "summary": "Each has strengths — better together",
            "detail": "They each have strengths the other lacks; together they're greater than the sum. He's good at fighting but bad at reading situations; she's great at analysis but can't execute. The core is cooperation, not protection. The appeal: when one is temporarily absent, the other discovers just how much they depended on that missing piece."
          }
        }
      },
      {
        "id": "H3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "H3 暗处破局",
            "summary": "看似弱势但握有关键",
            "detail": "她表面上看起来是弱势方——没有武力、没有权力、没有特殊能力。但她掌握着解决核心矛盾的关键：可能是一条关键信息、一种他无法理解的视角、或一项他不具备的能力。他的力量打不开的锁，只有她能打开。核心看点：所有人都以为她无足轻重，但最终是她扭转了局面。"
          },
          "en": {
            "label": "H3 Hidden Key",
            "summary": "Looks weak but holds the critical piece",
            "detail": "On the surface she looks like the weaker party — no combat power, no authority, no special abilities. But she holds the key to the core conflict: critical information, a perspective he can't grasp, or a skill he doesn't have. The lock his strength can't open, only she can. The appeal: everyone assumes she's insignificant, but she's the one who turns the tide."
          }
        }
      },
      {
        "id": "H4",
        "order": 3,
        "copy": {
          "zh": {
            "label": "H4 柔软之刃",
            "summary": "不强大但能改变他",
            "detail": "她不强大、没有什么特殊能力，但她的存在本身改变了他。可能是她的温柔让他放下了戒备，她的固执让他重新审视自己的选择，或者她看世界的方式和他完全不同。她改变他不是通过变强，而是通过保持自己。核心看点：一个足以改变世界的人，被一个普通人改变了。"
          },
          "en": {
            "label": "H4 Gentle Blade",
            "summary": "Not powerful, but her existence changes him",
            "detail": "She's not powerful, has no special abilities, but her very existence changes him. Maybe her warmth made him lower his guard, her stubbornness made him rethink his choices, or she sees the world in a way he never considered. She changes him not by becoming strong, but by staying herself. The appeal: a man powerful enough to change the world, changed by an ordinary person."
          }
        }
      }
    ]
  },
  {
    "id": "time",
    "code": "T",
    "kind": "structure",
    "order": 13,
    "copy": {
      "zh": {
        "label": "T = Time（时间）",
        "description": "时间怎么折磨你们",
        "wisdom": "T 轴（时间）决定时间如何折磨这段关系——寿命差、循环、错位还是遗忘。",
        "intro": "时间如何给这段关系施加压力。四种不同的时间机制，每种都有独特的虐法和叙事节奏。选择时间轴会触发时间线模式，生成完整的命运弧线而不只是开场。",
        "links": "T + F = 叙事弧线。T1 寿命差 + F3 永隔 = 一开始就知道结局的悲剧；T2 时间循环 + F4 轮回 = 永远在重来中寻找希望。B 轴暗示时间压力的来源。"
      },
      "en": {
        "label": "T = Time",
        "description": "How time torments you both",
        "wisdom": "The T axis (Time) determines how time torments this relationship — lifespan gaps, loops, displacement, or forgetting.",
        "intro": "How time pressures this relationship. Four different time mechanisms, each with its own unique cruelty and narrative rhythm. Selecting any time axis triggers Timeline mode, generating a full fate arc instead of just an opening.",
        "links": "T + F = Narrative arc. T1 lifespan gap + F3 eternal separation = tragedy known from the start; T2 time loop + F4 rebirth = hope in endless repetition. B axis hints at the source of time pressure."
      }
    },
    "options": [
      {
        "id": "T1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "T1 寿命差",
            "summary": "他不老你会死，爱混着倒计时",
            "detail": "他是神/AI/吸血鬼/精灵，你是普通人类。你会衰老死去，他不会。残酷的不是你的死亡本身，而是他从爱上你那一刻就知道这个结果——爱从一开始就混合着倒计时。每一天都同时是相聚和告别。核心问题：明知会失去，他还要不要开始？"
          },
          "en": {
            "label": "T1 Lifespan Gap",
            "summary": "He won't age, you will — love starts with a countdown",
            "detail": "He's a god/AI/vampire/elf; you're a mortal human. You'll age and die; he won't. The cruelty isn't your death itself — it's that he knew the outcome the moment he fell for you. Love is mixed with a countdown from the start. Every day is simultaneously a reunion and a farewell. Core question: knowing he'll lose you, should he even begin?"
          }
        }
      },
      {
        "id": "T2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "T2 时间循环",
            "summary": "他记得一万次，你每次都忘",
            "detail": "他被困在时间循环里。对你来说是初次见面，对他来说已经是第一万次。他在无数条时间线里尝试救你，每一次都失败，每一次你都忘记了他。他带着一万次的记忆重量说出'你好，初次见面'。核心问题：如果他放弃尝试，你就永远活不过这一天。"
          },
          "en": {
            "label": "T2 Time Loop",
            "summary": "He remembers ten thousand times, you forget each one",
            "detail": "He's trapped in a time loop. For you it's a first meeting; for him it's the ten-thousandth. He's tried to save you across countless timelines, failing every time, and every time you forget him. He carries the weight of ten thousand memories as he says 'Nice to meet you.' Core question: if he stops trying, you die today — permanently."
          }
        }
      },
      {
        "id": "T3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "T3 时空错位",
            "summary": "他从过去/封印中醒来，世界全变了",
            "detail": "他从封印/休眠/过去/未来醒来，世界已经天翻地覆。你是他在这个陌生新世界里唯一的连接点。他不理解现在的规则、文化和常识，现在的世界也不理解他。核心问题：他要在一个自己不属于的时代里重新学会生活——而你是他唯一的老师。"
          },
          "en": {
            "label": "T3 Temporal Displacement",
            "summary": "He wakes in the wrong era — you're his only anchor",
            "detail": "He woke from a seal/hibernation/the past/the future, and the world has completely changed. You're his only connection to this strange new world. He doesn't understand current rules, culture, or common sense; the current world doesn't understand him. Core question: he must learn to live in an era he doesn't belong to — and you're his only teacher."
          }
        }
      },
      {
        "id": "T4",
        "order": 3,
        "copy": {
          "zh": {
            "label": "T4 记忆侵蚀",
            "summary": "正在忘记彼此，渐进且不可逆",
            "detail": "他正在忘记你，或者你正在忘记他。不是突然消失，而是渐进的：今天还记得你的名字，明天只记得轮廓，后天看着你问'你是谁？'。核心问题：在记忆彻底消失之前，你们还能做什么？每一次对话都可能是最后一次他还认得你的对话。"
          },
          "en": {
            "label": "T4 Memory Erosion",
            "summary": "Forgetting each other — gradual, irreversible",
            "detail": "He's forgetting you, or you're forgetting him. Not suddenly — gradually: today he remembers your name, tomorrow only your silhouette, the day after he asks 'Who are you?' Core question: before the memories are completely gone, what can you still do? Every conversation might be the last one where he still recognizes you."
          }
        }
      }
    ]
  },
  {
    "id": "exchange",
    "code": "X",
    "kind": "structure",
    "order": 14,
    "copy": {
      "zh": {
        "label": "X = eXchange（代价）",
        "description": "他最终失去了什么",
        "wisdom": "X 轴（代价）决定他为这段感情最终失去什么——代价越重，终局的情感冲击越大。",
        "intro": "他为了这段感情最终失去了什么。代价的性质直接决定终局的形态——他做出什么样的牺牲（X），就导向什么样的结局（F）。代价必须和他的动机（M 轴）呼应——他为什么愿意付出这个代价。",
        "links": "X 必须与 M（动机）呼应。M1 外部使命 + X1 降格 = 他放弃使命选择你；M4 登顶野心 + X3 湮灭 = 他用存在本身换你的安全。P 轴限制代价的量级。"
      },
      "en": {
        "label": "X = eXchange (Cost)",
        "description": "What he ultimately loses",
        "wisdom": "The X axis (eXchange) determines what he ultimately loses for this love — the heavier the cost, the greater the emotional impact.",
        "intro": "What does he ultimately lose for this love? The nature of the cost directly determines the finale's shape — what he sacrifices (X) leads to what kind of ending (F). The cost must echo his motive (M) — why is he willing to pay this price?",
        "links": "X must echo M (Motive). M1 mission + X1 downgrade = he abandons his mission for you; M4 ambition + X3 annihilation = he trades existence itself for your safety. P axis caps cost magnitude."
      }
    },
    "options": [
      {
        "id": "X1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "X1 降格",
            "summary": "主动放弃力量/地位，变成普通人",
            "detail": "他主动放弃让自己高人一等的东西——神变成人、帝王变成平民、AI 删除高级功能、超能力者放弃能力。他降落到你所在的平面，从此和你一样普通。关键是这必须是主动选择——他不是被剥夺，而是心甘情愿交出。自然导向 F2 入世（一起过普通生活）。"
          },
          "en": {
            "label": "X1 Downgrade",
            "summary": "Surrenders power/status — becomes ordinary",
            "detail": "He voluntarily surrenders what makes him superior — god becomes mortal, emperor becomes commoner, AI deletes advanced functions, superhuman gives up powers. He descends to your level, becoming ordinary like you. The key: it must be a voluntary choice — not stripped away, but willingly surrendered. Naturally leads to F2 Ordinary Life."
          }
        }
      },
      {
        "id": "X2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "X2 升格",
            "summary": "变更强但更非人，越爱你越不像你爱的人",
            "detail": "为了保护你，他必须变得更强——代价是变得更冷酷、更非人、更远离你。从守护者变成暴君，从温柔的人变成效率机器。他越爱你就越不像你曾经爱上的那个他。核心矛盾：他保护你的方式正在摧毁你们的关系。"
          },
          "en": {
            "label": "X2 Upgrade",
            "summary": "Becomes stronger but colder — further from you",
            "detail": "To protect you, he must become stronger — but the cost is becoming colder, less human, further from you. From guardian to tyrant, from gentle person to efficiency machine. The more he loves you, the less he resembles the person you fell for. Core conflict: his method of protecting you is destroying your relationship."
          }
        }
      },
      {
        "id": "X3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "X3 湮灭",
            "summary": "用自己的存在换你的安全",
            "detail": "终极牺牲——他用自己的存在换你的安全。他的生命是你生存的对立面，他的消亡是你活下去的前提。他不在了，但他活在你的记忆里，活在你因为他而改变的人生轨迹里。自然导向 F3 永隔或 F4 轮回。"
          },
          "en": {
            "label": "X3 Annihilation",
            "summary": "Trades his existence for your survival",
            "detail": "The ultimate sacrifice — he trades his existence for your safety. His life is the inverse of yours; his erasure is the prerequisite for your survival. He's gone, but he lives in your memories and in the life trajectory he changed. Naturally leads to F3 Eternal Separation or F4 Rebirth."
          }
        }
      }
    ]
  },
  {
    "id": "finale",
    "code": "F",
    "kind": "structure",
    "order": 15,
    "copy": {
      "zh": {
        "label": "F = Finale（终局）",
        "description": "最终关系形态",
        "wisdom": "F 轴（终局）决定一切尘埃落定后你们的关系变成什么样子——合一、平凡、分离还是来世。",
        "intro": "一切尘埃落定之后，你们的关系变成了什么样子。F 轴是 X 轴的结果——他付出了什么代价，直接决定了你们最终的关系形态。",
        "links": "F 是 X 的结果。X1 降格→F2 入世（他变成普通人和你过日子）；X3 湮灭→F3 永隔或 F4 轮回。时间压力（T）决定终局到来的节奏。"
      },
      "en": {
        "label": "F = Finale",
        "description": "Final relationship form",
        "wisdom": "The F axis (Finale) determines what your relationship becomes when everything settles — union, ordinary life, separation, or rebirth.",
        "intro": "After everything settles, what does your relationship become? F is the consequence of X — what he sacrificed directly determines the final shape of your relationship.",
        "links": "F is the consequence of X. X1 downgrade → F2 ordinary life; X3 annihilation → F3 separation or F4 rebirth. Time pressure (T) sets the pacing toward the finale."
      }
    },
    "options": [
      {
        "id": "F1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "F1 融合",
            "summary": "意识合一，不再是两个人",
            "detail": "你们不再是两个独立个体——意识融合、赛博飞升、血拥永生、魂魄合一。'在一起'变成了一种存在方式而不只是关系状态。适用场景：B3 超越肉体的角色、P3 造物之权的设定。这是最极端的 HE，代价通常是你放弃了作为独立个体的自我。"
          },
          "en": {
            "label": "F1 Fusion",
            "summary": "Consciousness merged — no longer two people",
            "detail": "You're no longer two separate people — consciousness merged, cyber-ascension, blood-bond immortality, souls unified. 'Together' becomes an existential state, not just a relationship. Fits: B3 beyond-physical characters, P3 creator settings. The most extreme happy ending; the cost is usually surrendering your independent selfhood."
          }
        }
      },
      {
        "id": "F2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "F2 入世",
            "summary": "留在你的世界过普通生活",
            "detail": "他留在你的世界，学着过普通人的生活——买菜、做饭、挤地铁、为水电费发愁。这是最温暖的终局，也是最奢侈的——意味着一切外部阻力都被克服了，他愿意且能够放弃之前的身份。通常需要 X1 降格作为前提。"
          },
          "en": {
            "label": "F2 Ordinary Life",
            "summary": "Stays in your world, lives a normal life",
            "detail": "He stays in your world, learning to live as a regular person — grocery shopping, cooking, commuting, worrying about utility bills. The warmest finale, and the most extravagant — it means all external obstacles have been overcome and he's willing and able to give up his former identity. Usually requires X1 Downgrade."
          }
        }
      },
      {
        "id": "F3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "F3 永隔",
            "summary": "彼此相爱但无法共存",
            "detail": "他回到他该回的地方——天上、深渊、代码海洋、过去。你们彼此相爱，但注定无法共存于同一个空间或时间。这不是遗憾而是选择——他们都知道这是对双方最好的结果。通常由 X3 湮灭或 T1 寿命差导向。"
          },
          "en": {
            "label": "F3 Eternal Separation",
            "summary": "Love each other but can't coexist",
            "detail": "He returns where he belongs — the heavens, the abyss, the code ocean, the past. You love each other but are destined to exist in different spaces or times. This isn't regret but choice — they both know it's the best outcome for both sides. Usually led to by X3 Annihilation or T1 Lifespan Gap."
          }
        }
      },
      {
        "id": "F4",
        "order": 3,
        "copy": {
          "zh": {
            "label": "F4 轮回",
            "summary": "此生不成，留下来世的希望",
            "detail": "此生无法善终，但留下了微弱但确定的希望——下一次相遇、下一个时间线、下一世。既不是完全的 HE 也不是完全的 BE，是开放式的温柔。这个终局的情感效果取决于希望有多具体：模糊的希望是安慰，具体的希望是承诺。"
          },
          "en": {
            "label": "F4 Rebirth",
            "summary": "This life fails — faint hope for the next",
            "detail": "This life can't end well, but it leaves a faint, certain hope — the next meeting, the next timeline, the next life. Neither full happy ending nor full tragedy; an open-ended tenderness. The emotional impact depends on how specific the hope is: vague hope is comfort; specific hope is a promise."
          }
        }
      }
    ]
  },
  {
    "id": "palette",
    "code": "Palette",
    "kind": "palette",
    "order": 16,
    "copy": {
      "zh": {
        "label": "调色板（文本质感）",
        "description": "文字风格",
        "wisdom": "调色板只影响文字风格（世界切片、开场场景、开场金句），不改变世界观、人设或终局。",
        "intro": "调色板只影响三个部分的写法：世界切片、开场场景、开场金句。不改世界观、不改人设、不改终局——只改文字的温度、节奏和感官密度。每个选项附带正例和反例，帮助理解具体效果。",
        "links": ""
      },
      "en": {
        "label": "Palette (Text Tone)",
        "description": "Writing style",
        "wisdom": "The Palette only affects writing style (world slice, opening scene, opening line) — it doesn't change worldview, character, or ending.",
        "intro": "The palette only affects how three sections are written: world slice, opening scene, and opening line. It doesn't change worldview, character, or ending — only the temperature, rhythm, and sensory density of the text.",
        "links": ""
      }
    },
    "options": [
      {
        "id": "PAL1",
        "order": 0,
        "copy": {
          "zh": {
            "label": "冷调克制",
            "summary": "克制、留白、靠停顿和余韵起效",
            "detail": "特征：克制、疏冷、安静，感情不直说，靠留白、停顿和偶尔的体温暗示起效。适合古风清冷、近未来极简、任何需要压着写的场景。正例：'长廊尽头的灯亮得过白，风穿过回廊，带着潮木与药香。' '你再靠近一点，我才能确认这不是又一次误差。' 反例：一上来就热烈告白和大段心理独白。"
          },
          "en": {
            "label": "Cold Restraint",
            "summary": "Restrained, white space, warmth through pauses",
            "detail": "Traits: restrained, cool, quiet. Feelings are never stated directly — they work through white space, pauses, and the occasional hint of body warmth. Fits: classical cool aesthetics, near-future minimalism, anything that needs to be written below the surface."
          }
        }
      },
      {
        "id": "PAL2",
        "order": 1,
        "copy": {
          "zh": {
            "label": "炽艳锋芒",
            "summary": "高饱和高热度，美感和威胁并存",
            "detail": "特征：高饱和、高热度、高反差，美和危险同时存在。颜色浓、动作近、呼吸重，每个画面都在视觉上给压力。正例：'檐角灯笼烧得通红，烛火把杯壁里的酒照成暗红，香气浮得太甜。' '这城今晚就算塌下来，你也得先跟我走。' 反例：只堆砌华丽词汇，没有实际的热度和紧迫感。"
          },
          "en": {
            "label": "Blazing Edge",
            "summary": "High-saturation — beauty and threat coexist",
            "detail": "Traits: high-saturation, high-heat, high-contrast. Beauty and danger coexist. Colors are vivid, proximity is close, breathing is heavy — every frame pushes visual pressure. Fits: anything that should feel gorgeous and threatening simultaneously."
          }
        }
      },
      {
        "id": "PAL3",
        "order": 2,
        "copy": {
          "zh": {
            "label": "庄严崇高",
            "summary": "庄重、有分量感、带誓约感",
            "detail": "特征：庄重、抬升、有分量感，私人感情被放在更大的命运背景前。适合史诗叙事、宗教/信仰背景、重大牺牲场景。正例：'广场上的钟声刚落，石阶仍带夜里的寒意。' '若命运要向你索取代价，我先替你站上祭坛。' 反例：用轻佻的日常口语破坏整体重量。"
          },
          "en": {
            "label": "Solemn Grandeur",
            "summary": "Grave, weighty — feelings against a fate backdrop",
            "detail": "Traits: grave, elevated, weighty. Personal feelings are set against a larger fate backdrop. Fits: epic narrative, religious/faith contexts, major sacrifice scenes."
          }
        }
      },
      {
        "id": "PAL4",
        "order": 3,
        "copy": {
          "zh": {
            "label": "粗砺纪实",
            "summary": "少修辞、重触感、温柔落在具体动作上",
            "detail": "特征：少修辞、重触感、重细节，温柔必须落在具体动作上而不是抽象语言上。适合战争、废土、底层生活等高压生存场景。正例：'风里全是土，水桶沿碰得叮当响。' '先把手给我，别逞强，今晚先活下来。' 反例：一边写断粮伤口，一边用华丽辞藻把痛苦写得很美。"
          },
          "en": {
            "label": "Raw Realism",
            "summary": "Minimal rhetoric, tenderness in specific actions",
            "detail": "Traits: minimal rhetoric, heavy on texture and detail. Tenderness must land in specific actions, not abstract language. Fits: war, wasteland, underclass life — any high-pressure survival setting."
          }
        }
      },
      {
        "id": "PAL5",
        "order": 4,
        "copy": {
          "zh": {
            "label": "阴影暧昧",
            "summary": "半真半假，亲密和算计并行",
            "detail": "特征：怀疑、勾连、半真半假，亲密和算计并行。适合谍战、宫斗、灰色地带角色。正例：'巷口的灯坏了一半，门后有人，却一直没把锁舌完全拨开。' '你最好别信我，可你今晚最好也别离开我的视线。' 反例：写成纯甜宠（没有算计感）或纯悬疑（没有暧昧感）。"
          },
          "en": {
            "label": "Shadow Ambiguity",
            "summary": "Half-true, half-false — intimacy and calculation",
            "detail": "Traits: suspicious, entangled, half-true half-false. Intimacy and calculation run in parallel. Fits: spy games, palace intrigue, morally grey characters."
          }
        }
      },
      {
        "id": "PAL6",
        "order": 5,
        "copy": {
          "zh": {
            "label": "温柔日常",
            "summary": "慢热、具体，温柔来自反复的小事",
            "detail": "特征：贴身、慢热、具体，温柔来自反复出现的小事而不是大段抒情。适合现代生活、治愈系、慢节奏叙事。正例：'窗边晾着的衬衣还带一点太阳味，灶上水刚滚。' '先把外套穿上，别的事回家再慢慢说。' 反例：堆砌治愈口号（'你值得被爱'），却没有一个能摸到的具体细节。"
          },
          "en": {
            "label": "Warm Everyday",
            "summary": "Slow-burn specifics — warmth in repeated small things",
            "detail": "Traits: close, slow-burn, specific. Warmth comes from repeated small things, not grand declarations. Fits: modern life, healing stories, slow-paced narrative."
          }
        }
      },
      {
        "id": "PAL7",
        "order": 6,
        "copy": {
          "zh": {
            "label": "怪奇寓言",
            "summary": "意象奇异但规则自洽",
            "detail": "特征：规则微歪、意象奇异，但内部逻辑必须自洽。适合怪谈、寓言、超现实、非线性叙事。正例：'井边的铜铃无风自响，墙上的影子比人慢半拍。' '别碰那盏灯，它记人脸，也记人的谎。' 反例：乱塞恐怖意象（骨头/黑猫/血字）但没有统一的规则逻辑。"
          },
          "en": {
            "label": "Strange Fable",
            "summary": "Uncanny imagery, bent rules, internally consistent",
            "detail": "Traits: slightly bent rules, uncanny imagery, but internally consistent logic. Fits: ghost stories, fables, surrealism, non-linear narrative."
          }
        }
      },
      {
        "id": "PAL8",
        "order": 7,
        "copy": {
          "zh": {
            "label": "静默极简",
            "summary": "极简短句，情绪压在停顿里",
            "detail": "特征：极简、安静、依靠减法，情绪全压在停顿和短句里。适合内敛角色、离别场景、极端情绪后的沉默。正例：'雨停了。窗没关严。桌上那盏灯亮着。' '你别怕。我在。' 反例：表面句子很短，但实际每句都在堆抽象形容词。"
          },
          "en": {
            "label": "Silent Minimal",
            "summary": "Ultra-short sentences — emotion in the pauses",
            "detail": "Traits: ultra-minimal, quiet, relies on subtraction. All emotion is compressed into pauses and short sentences. Fits: reserved characters, farewell scenes, silence after extreme emotion."
          }
        }
      }
    ]
  }
] as const satisfies readonly AxisDefinition[];

export type Axis = (typeof AXES)[number];
export type AxisId = Axis["id"];
export type AxisCode = Axis["code"];
export type AxisOption = Axis["options"][number];
export type OptionId = AxisOption["id"];
export type FateSelection = DomainSelection<AxisId, OptionId>;

const AXIS_BY_ID = new Map<AxisId, Axis>(
  AXES.map((axis) => [axis.id, axis] as const),
);

const OPTION_BY_ID = new Map<OptionId, AxisOption>(
  AXES.flatMap((axis) =>
    axis.options.map((option) => [option.id, option] as const),
  ),
);

const TIMELINE_AXIS_IDS: ReadonlySet<AxisId> = new Set([
  "time",
  "exchange",
  "finale",
]);

export function getAxis(axisId: AxisId): Axis {
  const axis = AXIS_BY_ID.get(axisId);
  if (!axis) {
    throw new RangeError(`Unknown axis ID: ${axisId}`);
  }
  return axis;
}

export function getOption(optionId: OptionId): AxisOption {
  const option = OPTION_BY_ID.get(optionId);
  if (!option) {
    throw new RangeError(`Unknown option ID: ${optionId}`);
  }
  return option;
}

export function optionBelongsToAxis(
  axisId: AxisId,
  optionId: OptionId,
): boolean {
  return getAxis(axisId).options.some((option) => option.id === optionId);
}

export function detectGenerationMode(
  selections: readonly FateSelection[],
): GenerationMode {
  return selections.some((selection) =>
    TIMELINE_AXIS_IDS.has(selection.axisId),
  )
    ? "timeline"
    : "opening";
}
