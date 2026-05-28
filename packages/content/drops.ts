import type { Locale, SuttaSlug } from "./index";

export const DROPS: Record<Locale, Record<SuttaSlug, string>> = {
  en: {
    "first-talk":
      "Between chasing pleasure and punishing yourself, there's a third way. That's the whole thing.",
    "not-self":
      "When you loosen your grip on what you take yourself to be, you stop being so easily wounded by what happens to it.",
    "fire-sermon":
      "The three fires — wanting, anger, confusion — are always burning somewhere in you. Noticing them is how they cool.",
    "loving-kindness":
      "Remember the mother and her only child. Open your heart that wide — toward every living thing, with no one left out.",
    mindfulness:
      "You don't have to fix what you notice. Watching is enough. Body, feelings, mind, experience — the four are always there.",
    "how-to-decide":
      "Nothing here asks for your faith. Test it against your own life. If it leads to harm, drop it. If it leads to ease and clarity, take it up.",
  },
  zh: {
    "first-talk":
      "在追逐快感和折磨自己之间，还有第三条路。说的就是这件事。",
    "not-self":
      "当你松开手，不再紧紧抓着「我以为我是的那个东西」，你也就不那么容易被发生在它身上的事砸伤了。",
    "fire-sermon":
      "三把火——想要、愤怒、糊涂——一直在你身上某个地方烧着。看见它们，就是它们冷下来的方式。",
    "loving-kindness":
      "想想那位母亲和她的独生子。把心打开到那么宽——朝向每一个活着的生命，一个都不落下。",
    mindfulness:
      "你不必去修理你看到的东西。看着就够了。身体、感受、心、经验——这四样一直都在那里。",
    "how-to-decide":
      "这里没有任何东西要你来信。拿你自己的生命去验证它。如果它带来伤害，放下。如果它带来安稳和清明，拿起来。",
  },
};

export const PREFACE: Record<Locale, string> = {
  en: `After waking under the Bodhi tree, the Buddha sat for a while figuring out what to do. He'd seen something. But could it be said? At first he thought no one would understand. Then he changed his mind, got up, and walked west to find the five old friends he'd left behind when their shared path of harsh self-denial had taken him as far as it could.

He found them in the deer park near Varanasi. They'd resolved not to greet him — he'd quit, after all. But there was something about the way he walked, and by the time he arrived they were preparing him a seat.`,
  zh: `在菩提树下觉醒之后，佛陀坐了一会儿，想着接下来该做什么。他看到了一样东西。但这东西讲得出来吗？一开始他想，没有人会听懂。然后他改变了主意，起身往西走，去找从前的五位老朋友——当年他们一起苦修自虐，那条路走到了尽头，他离开了他们。

他在瓦拉纳西附近的鹿野苑找到了他们。他们本来商量好不理他——毕竟他半路退出了。但他走路的样子有点不一样，等他走到的时候，他们已经在给他备座位了。`,
};

export const CLOSING: Record<Locale, string> = {
  en: `Six teachings. That's the foundation — what he actually said, before any of it became a religion, before there were schools or commentaries.

Read them slowly. Read them more than once. The work from here is yours.`,
  zh: `六篇开示。这就是根基——他真正说过的话，在这一切变成一个宗教之前，在那些宗派和注解出现之前。

慢慢读。读不止一遍。接下来的功夫，是你自己的事。`,
};
