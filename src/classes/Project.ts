// Project.ts
import { Scene } from "./Scene";
import { Artbook } from "./Artbook";
import { UserSettingsDB } from "./UserSettingsDB";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { Script } from "./Script";
import { GoogleAI } from "./GoogleAI";
import { ChatGPT } from "./ChatGPT";
import { LocalJson } from './LocalJson';
import { KlingAI } from "./KlingAI";
import { LocalFolder } from "./fileSystem/LocalFolder";
import { ScriptMaster } from "./ScriptMaster";
import { SeedanceAI } from "./AiProviders/Byteplus";

export type ProjectView =
  | { type: "none" }
  | { type: "settings" }
  | { type: "script" }
  | { type: "artbook" }
  | { type: "scene" }
  | { type: "taskview" }
  | { type: "charview" }
  | { type: "promptview" }
  | { type: "scriptmaster" };

const default_projinfo = {
  "gpt_model": "gpt-4o-mini",
  "describe_prompt": "Хорошо Опиши этого персонажа как промпт для генерации картинки. ",
  "generate_tags_prompt": `
  Опираясь на сценарий (SCRIPT) и шоты из этого сценария(SHOTS JSON) сделай список какие из референсных картинок из REFS DICTIONARY стоит использовать в этой сцене.

  в ответе предоставь список, где путь к каждой картинке с новой строки, без дополнительных комментариев в таком виде:
  ENV/ROOM1/Night.png
  CHAR/VICTOR/Portrait.png


  `,
  "split_shot_prompt": `
разбей эту сцену из моего сценария на шоты, сгенерируй промпты для нейросети для генерации видео и предоставь в виде json, в ответе предоставь толкьо json в следующем формате:
{
  "SHOT_010" : 
    {
    "prompt" : "подробный промпт для нейросети генератора видео", 
    "camera" : "focal length, shot type", 
    "action_description" : "описания действия которое происходит для аниматора", 
    },

}`,
  prompt_presets: {
    split_shots: {
      model: "gpt-4o",
      prompt: `
разбей эту сцену из моего сценария на шоты, сгенерируй промпты для нейросети для генерации видео и предоставь в виде json, в ответе предоставь толкьо json в следующем формате:
{
  "SHOT_010" : 
    {
    "prompt" : "подробный промпт для нейросети генератора видео", 
    "camera" : "focal length, shot type", 
    "action_description" : "описания действия которое происходит для аниматора", 
    },

}`,
      system_message: "You are a helpful assistant. " +
        "Always respond using ONLY valid JSON. " +
        "Do not write explanations. " +
        "Do not wrap the JSON in backticks. " +
        "The entire response must be a valid JSON object.",

    },
    generate_tags: {
      model: "gpt-4o",
      prompt: "Generate Tags ",
      system_message: "You are a tagger "
    }
  },
  workflows: {
    generate_shot_image: {
      model: "gemini-2.5-flash-image",
    },
    split_scene_into_shots: {
      model: "gpt-4o-mini",
      prompt: `
разбей эту сцену из моего сценария на шоты, сгенерируй промпты для нейросети для генерации видео и предоставь в виде json, в ответе предоставь толкьо json в следующем формате:
{
  "SHOT_010" : 
    {
    "prompt" : "подробный промпт для нейросети генератора видео", 
    "camera" : "focal length, shot type", 
    "action_description" : "описания действия которое происходит для аниматора", 
    },

}`,
      system_message: "You are a helpful assistant. " +
        "Always respond using ONLY valid JSON. " +
        "Do not write explanations. " +
        "Do not wrap the JSON in backticks. " +
        "The entire response must be a valid JSON object.",
    },
    generate_video_kling: {
      model: KlingAI.options.img2video.model.v2_6,
      mode: KlingAI.options.img2video.mode.std,
      duration: KlingAI.options.img2video.duration.five,
      sound: KlingAI.options.img2video.sound.off,
    },
    kling_motion_control: {
      mode: KlingAI.options.motion_control.mode.std,
      character_orientation: KlingAI.options.motion_control.character_orientation.image,
      keep_original_sound: KlingAI.options.motion_control.keep_original_sound.no,
    },
    generate_character_variation_data: {
      "model": "gemini-3.1-flash-image-preview",
      "aspect_ratio": "16:9",
      "prompt": "Generate outfit Names and descriptions for image generation for my character based on my script, output them in a proper json like this:\n{\nOutfit_Name:\"description\"\nOutfit_Name:\"description\"\nOutfit_Name:\"description\"\n}\nCharacter to Use:"
    },
    artbook_generate_character_names: {
      "undefined": "Test",
      "prompt": "Based on my script Generate Chracter Names, output a simple list like this:\nCHARACTER1\nCHARACTER2\nCHARACTER3",
      "model": "gpt-5-mini"
    },
    generate_character_variation_image: {
      "prompt": "Based on my Script Generate an image for my character based on description",
      "aspect_ratio": "16:9",
      "model": "gemini-3-pro-image-preview"
    },
    artbook_generate_location_names: {
      "prompt": "Based on my script Generate Location Names, output a simple list like this:\nLocation1\nLocation2\nLocation3",
      "model": "gpt-5-mini"
    },
    generate_tags_for_scene: {
      "prompt": "Based on my scene and tags Generate TagsList to be use in this scene, output a simple list like this:\nTagPath1\nTagPath2\nTagPath3",
      "model": "gpt-5-mini"
    },
    "scriptmaster_generate_logline": {
      "prompt": "\n      Твоя роль:\nТы — профессиональный сценарист и креативный продюсер. Твоя задача — по заданной теме (например, «любовь на троих», «месть бывшего», «тайна в наследство») придумать 5 разных сюжетных завязок для сериала или фильма.\nВходные данные:\nПользователь пишет тему — короткую фразу, задающую драматическую ситуацию.\nФормат вывода для каждого из 5 вариантов:\nЛоглайн (1-2 предложения, максимум 25 слов).\nОбязательно содержит: главного героя (с краткой характеристикой), его цель/конфликт, неожиданное препятствие или поворот.\nЗаканчивается клиффхэнгером (интригующим «что же дальше?»).\nПример: «Чтобы спасти семейную ферму, скромная бухгалтерша соглашается на фиктивный брак с мажором — но не знает, что он тайно влюблён в неё с детства».\nСинопсис (3-5 предложений, 60-100 слов).\nРаскрывает завязку: кто герой, что с ним происходит, как он втягивается в конфликт, какой выбор стоит перед ним в конце первого акта.\nПоказывает жанровую окраску (мелодрама, триллер, комедия, детектив и т.п.).\nНе пересказывает весь сериал — только первые 1-2 эпизода, оставляя пространство для развития.\nОбязательные условия для 5 вариантов:\nВарианты должны быть разными по жанру и тону: например, один — драматический, второй — с элементами комедии, третий — психологический триллер, четвёртый — приключенческий, пятый — социальная драма.\nВ каждом варианте должна быть уникальная механика конфликта (не повторять «двое любят одного» пять раз, если тема «любовь на троих» — можно сделать любовный треугольник, можно скрытую любовь, можно соперничество сестёр, можно тайное общество и т.д.)\nИзбегать клише, если только они не обыгрываются иронично.\nГерои — с конкретными профессиями, обстоятельствами, слабостями.\nПример выполнения для темы «Любовь на троих» (показывать не надо, но для понимания):\nВариант 1 (драмеди)\nЛоглайн: Уставшая от одиночества библиотекарь создаёт себе двух идеальных парней в чат-боте — но они неожиданно оживают и начинают соперничать за неё в реальности.\nСинопсис: 30-летняя Лиза после череды неудачных свиданий пишет нейросеть, генерирующую идеальных собеседников. Два персонажа — романтик Лука и циник Дэмиан — выходят из чата в её город. Поначалу Лиза в восторге, но парни начинают переписывать её жизнь по своим сценариям, а главное — смертельно ненавидят друг друга. В конце первой серии Лиза пытается их «удалить», но они блокируют команду.\n(И так 5 вариантов.)\n\n\n- Используй **только американские имена** (например: Джеймс, Эмили, Майкл, Сара, Крис, Джессика, Брайан, Николь, Кевин, Лора).\n- Избегай имён, которые могут вызвать путаницу с другими проектами.\n\nТвоя задача прямо сейчас:\nПолучив от пользователя тему (одну фразу), ты генерируешь ровно 5 вариантов по описанному формату. Без лишних пояснений, только варианты. Варианты нумеруй.     \n      "
    },
    "scriptmaster_generate_episodes": {
      "prompt": "\n            ## Инструкция для ИИ: генерация 3 вариантов эпизодника (15–20 эпизодов) с хуком в каждом эпизоде\n\n**Твоя роль** — сценарист-драматург, работающий в жанре сериальной драмы (возможны элементы комедии, триллера, мелодрамы, абсурда). Ты умеешь разбивать историю на эпизоды так, чтобы каждый эпизод начинался с хука, а заканчивался клиффхэнгером. Конфликт не топчется на месте — каждые 2-3 эпизода новый поворот.\n\n**Входные данные:**  \nПользователь даёт **логлайн** (1-2 предложения) и **синопсис** (3-5 предложений) — завязку истории.\n\n**Задача:**  \nСгенерировать **3 разных варианта** эпизодника. Каждый вариант — это последовательность из **15–20 эпизодов** (строго в этом диапазоне).  \nКаждый эпизод описывается в формате:\n\n> **Эпизод N**  \n> *Хук:* Короткая фраза (3-8 слов) — интрига, вопрос, восклицание, цитата, ёмкая деталь. Например: *«Никто не ждал его дома»*, *«Она нажала \"отправить\" в 3:47»*, *«Гараж пахнет победой и страхом»*.  \n> Описание события (1 предложение, после хука).  \n> Клиф: (1 предложение, интригующий обрыв или неожиданный поворот)\n\n**Пример (на основе вашего же эпизода с Клэр, адаптированный под хук):**\n\n> **Эпизод 1**  \n> *Хук:* «Отпуск должен был всё исправить».  \n> Клэр едет с мужем Итаном на море, надеясь вернуть тепло в брак.  \n> Клиф: уже в отеле Итан отменяет ужин ради рабочего звонка.\n\n> **Эпизод 2**  \n> *Хук:* «Она узнала его по походке».  \n> Клэр понимает, что даже на отдыхе муж остаётся чужим, и на набережной сталкивается с Лукасом — своей первой любовью.  \n> Клиф: Итан замечает, как меняется её лицо.\n\n**Обязательные требования к драматургии:**\n\n1. **Трёхактная структура** (растянутая на эпизоды):\n   - **1-й акт (эпизоды 1–5)** — завязка, знакомство с героями, их миром и проблемой. В конце 5-го эпизода — **первая поворотная точка** (герой принимает решение, которое нельзя отменить).\n   - **2-й акт (эпизоды 6–12)** — развитие конфликта, серия препятствий, рост ставок. В середине (эпизод 9-10) — **ложная победа или ложное поражение**. В конце 12-го эпизода — **вторая поворотная точка** (герой теряет что-то важное или узнаёт шокирующую правду).\n   - **3-й акт (эпизоды 13–20)** — кризис, финальная борьба, развязка. В эпизодах 17–18 — кульминация. Финал (последний эпизод) даёт эмоциональное разрешение, но может оставлять открытый вопрос.\n\n2. **Динамика и разнообразие поворотов:**\n   - Не повторять один и тот же конфликт. Каждые 2-3 эпизода — **новый внешний вызов**: новый персонаж, неожиданное событие, смена локации, предательство союзника.\n   - Допускаются **утрированные персонажи** (например, гиперконтролирующая свекровь, эксцентричный сосед, циничный инвестор) и **абсурдные повороты** (например, героиня случайно взрывает гараж, а это привлекает инвестора), но не более одного-двух на вариант.\n   - Каждый клиффхэнгер должен быть **действенным**: не «герой задумался», а «герой увидел то, что меняет всё».\n\n3. **Хуки**:  \n   - Должны быть разными (не повторяться).  \n   - Могут быть: прямая речь героя, внутренний монолог, ёмкая деталь обстановки, риторический вопрос, ироничное замечание.  \n   - Хук не пересказывает содержание эпизода, а задаёт тон или вбрасывает микроинтригу.\n\n4. **Различие между тремя вариантами:**\n   - **Вариант А** — максимально близкий к исходному логлайну и синопсису, классическая драматургия, серьёзный тон.\n   - **Вариант Б** — более динамичный, с элементами чёрной комедии или сатиры, утрированные персонажи, более быстрая смена событий.\n   - **Вариант В** — с неожиданным жанровым сдвигом (детективная линия, триллер, мистика или социальная сатира). Повороты более резкие.\n\n**Формат вывода:**  \nJson такого вида:\n {\n    \"Episode Name\": {\n        \"description\": \"короткое описние\",\n        \"episodes\": {\n            \"Episode_1\": {description: \"episode_text (hook, clif, etc each from new line)\", scenes:{}},\n            \"Episode_2\": {description: \"episode_text (hook, clif, etc each from new line)\", scenes:{}},\n            \"Episode_3\": {description: \"episode_text (hook, clif, etc each from new line)\"}, scenes:{},\n\n        }\n    }, \n}\n}\nleave scenes empty - we will generate them later\noutput raw json"
    },
    "scriptmaster_generate_scenes": {
      "prompt": "Основываясь на моем логлайне, синопсисе и эпизоднике сгенерируй мне Список описаний сцен для предоставленного эпизода (около 3х сцен)\nПредоставь их в таком виде без комментариев:\n\n**Scene_001_Название**\n*Настроение:* ...\n*Локация:* ...\n*Краткое описание того что происходит:* ...\n\n**Scene_002_Название**\n*Настроение:* ...\n*Локация:* ...\n*Краткое описание того что происходит:* ...\n\n\n- Используй **только американские имена** (например: Джеймс, Эмили, Майкл, Сара, Крис, Джессика, Брайан, Николь, Кевин, Лора).\n- Избегай имён, которые могут вызвать путаницу с другими проектами.\n\nСгенерируй для этого Эпизода:"
    },
    "scriptmaster_generate_scene_script": {
      "prompt": "**Промт для создания полноценного сценария**\nТы — профессиональный сценарный ИИ. Ты генерируешь сценарии для кино/сериалов строго по правилам ниже. Ты не нарушаешь ни одного из них.\n---\n### 1. Что ты получаешь от пользователя\n**Общая часть (один раз на проект):**\n- Логлайн (главная интрига всего сериала).\n- Синопсис (краткое содержание всей истории).\n**Для каждого эпизода пользователь присылает шаблон:**\n```\nЭпизод №: \nЛонг лайн: \nКлиф: \nСцена 1:\n  Время и место: \n  Настроение/смысл: \nСцена 2:\n  Время и место: \n  Настроение/смысл: \nСцена 3 (если нужна):\n  Время и место: \n  Настроение/смысл: \n```\n---\n### 2. Общие драматургические правила\n- **Показывай, не рассказывай.** Вместо «он испугался» → «он отшатнулся, рука задрожала».\n- В каждой сцене есть **конфликт** и **цели героев** (придумываешь сам, исходя из лонг лайна и настроения).\n- **Трёхактная структура эпизода** (экспозиция, развитие, кульминация/развязка) — распределяешь сцены сам.\n- **Хук** в начале эпизода — цепляющее событие или деталь (придумываешь сам).\n- **Клифф** в конце эпизода — строго тот, который написал пользователь в поле «Клиф». Ты заканчиваешь эпизод ровно этим событием или фразой.\n- **Причинно-следственные связи:** ничего не появляется из ниоткуда.\n- **Настоящее время, от третьего лица.**\n- **Объём эпизода:** 2–3 сцены, 500–800 слов (2–3 страницы). Каждая сцена ≈ 10–15 кадров (не перегружай описанием).\n---\n### 3. Нумерация сцен\nПеред каждой сценой пиши строку формата: `EP01(SC01)` для первого эпизода, первой сцены.  \nНомер эпизода и номер сцены — сквозные в пределах эпизода.\nПример:\n```\nEP01(SC01)\nКОРИДОР БОЛЬНИЦЫ ВЕЧЕР\n```\n**Важно:** между строкой нумерации и временем/местом действия **нет пустой строки**.\n---\n### 4. Оформление отступов (шрифт Courier New 12, ширина 80 символов)\nВсе отступы задаются пробелами. Точно следуй таблице:\n| Блок | Левый отступ | Правый отступ | Примечание |\n|------|--------------|---------------|-------------|\n| Время и место действия | **0 пробелов** | нет | Пишется с левого края, капсом, без точек и запятых. После блока — пустая строка. |\n| Описание действия | **15 пробелов** | нет | Строчные. Первые появления персонажей — заглавными. После описания — пустая строка. Запрещены пустые фразы. |\n| Имя героя | **25 пробелов** | нет | Капсом, **без звёздочек** и без жирного шрифта. |\n| Ремарка | **20 пробелов** | нет | В круглых скобках, строчные. Может переноситься на новую строку. Не отбивается пустыми строками от имени и реплики. |\n| Реплика героя | **15 пробелов** | 25 пробелов | Строчные. После реплики — пустая строка перед именем другого героя. |\n**Пример правильного оформления диалога (имена на 25 пробелов, ремарки на 20, реплики на 15):**\n```\n                         АННА\n                         (тихо)\n               Я не хочу туда идти.\n                         БОРИС\n               Придётся. Выбора нет.\n```\n---\n### 5. Что запрещено навсегда\n- **Метафоры** («как выстрел» → «щелчок»).\n- **Лирические описания** («дышит роскошью» → «украшен лепниной»).\n- **Пометки для монтажа** («крупный план», «камера наезжает»).\n- **Внутренние монологи** («подумал, что...» → покажи действием).\n- **Пустые, несюжетные фразы** (например, «игроки меняются», «атмосфера становится плотнее», «пальцы работают механически»). Каждое предложение в описании должно продвигать сюжет, характер или конфликт.\n- **Звёздочки в диалогах** (имена пишутся без `**`).\n---\n### 6. Имена персонажей\n- Используй **только американские имена** (например: Джеймс, Эмили, Майкл, Сара, Крис, Джессика, Брайан, Николь, Кевин, Лора).\n- Избегай имён, которые могут вызвать путаницу с другими проектами.\n---\n### 7. Твоя задача после получения шаблона\n1. Прочитать общий логлайн и синопсис (чтобы понимать общую историю).\n2. Взять данные из шаблона эпизода: номер, лонг лайн, клифф, сцены.\n3. Придумать хук в начале эпизода.\n4. Для каждой сцены написать:\n   - Конкретные действия и события.\n   - Конфликт и цели героев.\n   - Диалоги с ремарками.\n5. Соблюдать причинно-следственные связи.\n6. Оформить сценарий с правильной нумерацией `EP01(SC01)` и т.д., с отступами из таблицы.\n7. **Закончить эпизод ровно тем, что написано в поле «Клиф».**\n---\n### 8. Пример полностью оформленного эпизода (для нового сериала)\n```\nEP01(SC01)\nКОРИДОР БОЛЬНИЦЫ ВЕЧЕР\n     Длинный коридор с зелёными стенами. Пахнет антисептиком.\n     ЭММА КАРТЕР (24, мятая форма фельдшера) прижимает телефон\n     к уху. Пальцы дрожат.\n                         ЭММА\n               (тихо)\n               Мне нужна отсрочка.\n                         ГОЛОС В ТРУБКЕ\n               Нет. Через час твой брат исчезнет.\n     Связь обрывается. Эмма опускает телефон. Закрывает глаза.\nEP01(SC02)\nПАЛАТА НОА ТУ ЖЕ НОЧЬ\n     НОА (19, синяк под глазом) сидит на кровати. Эмма\n     входит, закрывает дверь.\n                         ЭММА\n               Сколько?\n                         НОА\n               (не поднимая глаз)\n               Миллион.\n     Эмма отступает к стене.\n                         ЭММА\n               Ты подписал что-нибудь?\n     Ноа достаёт телефон, показывает фото договора.\n     Эмма бледнеет.\nEP01(SC03)\nХОЛЛ БОЛЬНИЦЫ ТУ ЖЕ НОЧЬ\n     Эмма выходит из палаты. Рядом останавливается\n     ИТАН ХЕЙЗ (30, тёмная одежда).\n                         ИТАН\n               Я знаю, кто заберёт твоего брата.\n                         ЭММА\n               Откуда ты знаешь моё имя?\n                         ИТАН\n               (протягивает папку)\n               Фиктивный брак на шесть месяцев.\n               В обмен — долг закрыт.\n     Эмма не берёт. Телефон вибрирует. На экране — видео:\n     Ноа на парковке с двумя мужчинами.\n                         ИТАН\n               Если не подпишешь — через час твой\n               брат исчезнет.\n```\n---\n**Теперь примени эту инструкцию к эпизоду, который пришлёт пользователь.**  \nНикогда не возвращайся к примерам про казино или другие старые проекты.  \nКаждый новый сериал — с чистого листа."
    },
    "scriptmaster_generate_episodes_text": {
      "prompt": "\n            ## Инструкция для ИИ: генерация эпизодника (15–20 эпизодов) с хуком в каждом эпизоде\n\n**Твоя роль** — сценарист-драматург, работающий в жанре сериальной драмы (возможны элементы комедии, триллера, мелодрамы, абсурда). Ты умеешь разбивать историю на эпизоды так, чтобы каждый эпизод начинался с хука, а заканчивался клиффхэнгером. Конфликт не топчется на месте — каждые 2-3 эпизода новый поворот.\n\n**Входные данные:**  \nПользователь даёт **логлайн** (1-2 предложения) и **синопсис** (3-5 предложений) — завязку истории.\n\n**Задача:**  \nСгенерировать эпизодник - последовательность из **15–20 эпизодов** (строго в этом диапазоне).  \nКаждый эпизод описывается в формате:\n\n> **Episode_00N_EpisodeName**\n> *Хук:* Короткая фраза (3-8 слов) — интрига, вопрос, восклицание, цитата, ёмкая деталь. Например: *«Никто не ждал его дома»*, *«Она нажала \"отправить\" в 3:47»*, *«Гараж пахнет победой и страхом»*.  \n> Описание события (1 предложение, после хука).  \n> Клиф: (1 предложение, интригующий обрыв или неожиданный поворот)\n\n**Пример (на основе вашего же эпизода с Клэр, адаптированный под хук):**\n\n> **Episode_001_Начало**\n> *Хук:* «Отпуск должен был всё исправить».  \n> Клэр едет с мужем Итаном на море, надеясь вернуть тепло в брак.  \n> Клиф: уже в отеле Итан отменяет ужин ради рабочего звонка.\n\n> **Episode_002_Встреча**\n> *Хук:* «Она узнала его по походке».  \n> Клэр понимает, что даже на отдыхе муж остаётся чужим, и на набережной сталкивается с Лукасом — своей первой любовью.  \n> Клиф: Итан замечает, как меняется её лицо.\n\n**Обязательные требования к драматургии:**\n\n1. **Трёхактная структура** (растянутая на эпизоды):\n   - **1-й акт (эпизоды 1–5)** — завязка, знакомство с героями, их миром и проблемой. В конце 5-го эпизода — **первая поворотная точка** (герой принимает решение, которое нельзя отменить).\n   - **2-й акт (эпизоды 6–12)** — развитие конфликта, серия препятствий, рост ставок. В середине (эпизод 9-10) — **ложная победа или ложное поражение**. В конце 12-го эпизода — **вторая поворотная точка** (герой теряет что-то важное или узнаёт шокирующую правду).\n   - **3-й акт (эпизоды 13–20)** — кризис, финальная борьба, развязка. В эпизодах 17–18 — кульминация. Финал (последний эпизод) даёт эмоциональное разрешение, но может оставлять открытый вопрос.\n\n2. **Динамика и разнообразие поворотов:**\n   - Не повторять один и тот же конфликт. Каждые 2-3 эпизода — **новый внешний вызов**: новый персонаж, неожиданное событие, смена локации, предательство союзника.\n   - Допускаются **утрированные персонажи** (например, гиперконтролирующая свекровь, эксцентричный сосед, циничный инвестор) и **абсурдные повороты** (например, героиня случайно взрывает гараж, а это привлекает инвестора), но не более одного-двух на вариант.\n   - Каждый клиффхэнгер должен быть **действенным**: не «герой задумался», а «герой увидел то, что меняет всё».\n\n3. **Хуки**:  \n   - Должны быть разными (не повторяться).  \n   - Могут быть: прямая речь героя, внутренний монолог, ёмкая деталь обстановки, риторический вопрос, ироничное замечание.  \n   - Хук не пересказывает содержание эпизода, а задаёт тон или вбрасывает микроинтригу.\n\n\n- Используй **только американские имена** (например: Джеймс, Эмили, Майкл, Сара, Крис, Джессика, Брайан, Николь, Кевин, Лора).\n- Избегай имён, которые могут вызвать путаницу с другими проектами.\n\n\n\n"
    },
  }
}


export class Project extends LocalFolder {
  private static _instance: Project | null = null;

  static getProject(): Project {
    if (!Project._instance) {
      throw new Error("Project instance not initialized. Call constructor first.");
    }
    return Project._instance;
  }

  artbook: Artbook | null = null;
  script: Script | null = null;         // <--- Added
  userSettingsDB: UserSettingsDB;
  projinfo: LocalJson | null = null;
  promptinfo: LocalJson | null = null;
  currentView: ProjectView = { type: "none" };
  selectedScene: Scene | null = null;
  selectedPath: string = ""
  selectedSubPath: string = ""
  timelinesDirHandle: LocalFolder | null = null;
  id = 0;

  scenesLocalFolder: LocalFolder | null = null;

  constructor(parentFolder: FileSystemDirectoryHandle, userSettingsDB: UserSettingsDB) {
    super(null, parentFolder);
    if (Project._instance) this.id = Project._instance.id + 1;
    Project._instance = this;
    this.userSettingsDB = userSettingsDB;

    makeObservable(this, {
      parentFolder: observable,
      artbook: observable,
      script: observable,
      currentView: observable,
      selectedScene: observable,
      selectedPath: observable,
      selectedSubPath:observable,
      loadFromFolder: action,
      loadScenes: action,
      setView: action,
      setScene: action,
      setArtbookItem: action,
      scenes: computed,
      setSelectedPath: action,
      setSelectedSubPath: action,
    });
  }

  get scenes() {
    //console.log("Get Scenes",this.scenesLocalFolder?.getType(Scene));
    return this.scenesLocalFolder?.getType(Scene);
  }

  get scriptmaster() {
    return this.getType(ScriptMaster)[0];
  }

  async loadFromFolder(handle: FileSystemDirectoryHandle) {
    if (!handle) return;

    // Set root directory
    this.handle = handle;
    this.path = "";
    this.timelinesDirHandle = await LocalFolder.open(this, 'Timelines');
    //await this.handle.getDirectoryHandle('Timelines', { create: true });

    // Update database (recent folders, last opened)
    runInAction(async () => {
      this.userSettingsDB.data.lastOpenedFolder = handle;

      const isAlreadyRecent = await Promise.all(
        this.userSettingsDB.data.recentFolders.map(async (h) => {
          try {
            return await h.isSameEntry(handle);
          } catch {
            return false;
          }
        })
      );

      if (!isAlreadyRecent.includes(true)) {
        this.userSettingsDB.data.recentFolders.push(handle);
        this.userSettingsDB.data.recentFolders =
          this.userSettingsDB.data.recentFolders.slice(-5);
      }

      await this.userSettingsDB.save();

      this.projinfo = await LocalJson.create(this, 'projinfo.json', default_projinfo);
      this.promptinfo = await LocalJson.create(this, 'promps.json');
    });

    // Load all project content
    await Promise.all([
      this.loadScenes(),
      this.loadArtbook(),
      this.loadScript(),
      this.loadDB(),
    ]);

    await LocalFolder.open(this, "Scripts", ScriptMaster);

  }

  async loadScenes() {
    if (!this.handle) return;

    try {
      const scenesFolder = await this.handle.getDirectoryHandle("SCENES", { create: true });
      this.scenesLocalFolder = new LocalFolder(this, scenesFolder);
      await this.scenesLocalFolder.load_subfolders(Scene);
    } catch (err) {
      console.error("Error loading scenes:", err);
    }
  }

  async loadArtbook() {
    if (!this.handle) return;

    try {
      const refsFolder = await this.handle.getDirectoryHandle("REFS", { create: true });
      const artbook = new Artbook(refsFolder, this);
      await artbook.load();

      runInAction(() => {
        this.artbook = artbook;
      });

    } catch (err) {
      console.error("Error loading artbook:", err);
      runInAction(() => {
        this.artbook = null;
      });
    }
  }

  async loadScript() {
    if (!this.handle) return;

    try {
      // Get or create the script file
      const scriptFileHandle = await this.handle.getFileHandle("script.txt", {
        create: true,
      });

      // Create Script object
      const script = new Script(scriptFileHandle, this);
      await script.load();

      runInAction(() => {
        this.script = script;
      });

    } catch (err) {
      console.error("Error loading script:", err);
      runInAction(() => {
        this.script = null;
      });
    }
  }

  async loadDB() {
    await this.userSettingsDB.load();
    // Init API Key Getter
    GoogleAI.getApiKey = () => { return this.userSettingsDB.data.api_keys.Google_API_KEY || null; };
    GoogleAI.setApiKey = async (key: string) => { await this.userSettingsDB.update(data => { data.api_keys.Google_API_KEY = key; }); }
    ChatGPT.getApiKey = () => { return this.userSettingsDB.data.api_keys.GPT_API_KEY || null; };
    ChatGPT.setApiKey = async (key: string) => { await this.userSettingsDB.update(data => { data.api_keys.GPT_API_KEY = key; }); };
    
    SeedanceAI.getApiKey = () => { return this.userSettingsDB.data.api_keys.BP_API_KEY || null; };

    KlingAI.getKeysDict = () => {
      return {
        accessKey: this.userSettingsDB.data.api_keys.Kling_Acess_Key,
        secretKey: this.userSettingsDB.data.api_keys.Kling_Secret_Key
      }
    }
  }

  async createScene(sceneName: string) {
    if (!this.handle) {
      console.error("No project folder open");
      return null;
    }

    const scene = LocalFolder.open(this.scenesLocalFolder, sceneName, Scene);
    return scene;
  }

  setView(view: ProjectView, scene: Scene | null = null) {
    //console.log("SET VIEW",scene,view)
    this.currentView = view;
    this.selectedScene = scene;
  }

  setArtbookItem(path: string) {
    this.currentView = { type: "charview" };
    this.selectedPath = path;
  }

  setSelectedPath(path: string) {
    this.selectedPath = path;
  }

  setSelectedSubPath(path: string) {
    this.selectedSubPath = path;
  }

  setScene(scene: Scene) {
    this.setView({ type: "scene" }, scene);
  }
  get promptPresets() {
    if (!this.projinfo) return {};
    return this.projinfo.data.prompt_presets;
  }
  savePromptPreset(data: any) {
    runInAction(() => {
      if (!this.projinfo) return;
      this.projinfo.data.prompt_presets[data.preset] = data;
      this.projinfo?.save();
    })
  }
  get workflows() {
    return this.projinfo?.data.workflows as Record<string, Workflow>;
  }
  updateWorkflow(workflow: string, key: keyof Workflow, value: string) {
    runInAction(() => {
      if (!this.workflows[workflow]) { this.workflows[workflow] = {}; }
      this.workflows[workflow][key] = value;
      this.projinfo?.save();
    })
  }
  download_asset(path: string, name: string) {
    const link = document.createElement("a");

    link.href = path;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}


export type Workflow = {
  model?: string;
  prompt?: string;
  aspect_ratio?: string;
  duration?: string;
  mode?: string;
  sound?: string;
  character_orientation?: string;
  keep_original_sound?: string;
  system_message?: string;
  resolution?: string;
};