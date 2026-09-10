(() => {
  if (window.__toolkuOpenAAReferralReady) return;
  window.__toolkuOpenAAReferralReady = true;

  if (!document.querySelector('link[href="/css/openaa-referral.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/css/openaa-referral.css';
    document.head.appendChild(stylesheet);
  }

  const path = window.location.pathname;
  const slug = path === '/' ? 'home' : path.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '').replace(/\//g, '-');
  const campaign = slug || 'home';

  const groups = [
    {
      match: ['/tools/salary-calculator/', '/tools/hourly-to-salary/', '/tools/overtime-pay/', '/tools/take-home-pay/', '/tools/401k-calculator/'],
      destination: '/jobs',
      title: '算完收入，下一步可以看看工作机会',
      description: 'OpenAA 汇集美国华人招聘与求职信息，方便继续比较职位和收入。',
      label: '查看附近招聘'
    },
    {
      match: ['/tools/mortgage/', '/tools/rent-vs-buy/', '/tools/area/', '/tools/length/'],
      destination: '/housing',
      title: '预算有数了，再看看合适的房屋',
      description: '到 OpenAA 查看美国华人租房、售房和求租信息。',
      label: '查看华人房屋'
    },
    {
      match: ['/tools/car-payment/', '/tools/car-monthly-cost/', '/tools/gas-cost/', '/tools/mpg/'],
      destination: '/marketplace',
      title: '费用算好了，再看看二手车信息',
      description: '到 OpenAA 浏览美国华人发布的车辆与二手信息。',
      label: '查看二手车'
    },
    {
      match: ['/tools/shoe-size/', '/tools/mattress-size/', '/tools/discount/', '/tools/sales-tax/'],
      destination: '/marketplace',
      title: '需要购买或处理闲置物品？',
      description: 'OpenAA 有美国华人二手与闲置信息，可以顺便看看。',
      label: '查看二手与闲置'
    },
    {
      match: ['/tools/tip-calculator/', '/tools/split-bill/', '/tools/psi-bar/', '/tools/hp-kw/'],
      destination: '/services',
      title: '还需要本地生活服务？',
      description: '到 OpenAA 查找餐饮、维修及其他美国华人本地服务。',
      label: '查找本地服务'
    },
    {
      match: ['/tools/zip-code/', '/tools/area-code/'],
      destination: '/directory',
      title: '查完地区，再看看附近华人商家',
      description: 'OpenAA 商家目录可以继续查找附近的华人商家和服务。',
      label: '查找附近商家'
    }
  ];

  const dmvConfig = {
    destination: '/dmv',
    title: '材料确认后，可以继续练习 DMV 中文题库',
    description: 'OpenAA 提供纽约 DMV 中文笔试练习、模拟考试和错题复习。',
    label: '开始 DMV 中文练习'
  };

  const defaultConfig = {
    destination: '/',
    title: '还要处理其他美国生活事务？',
    description: 'OpenAA 汇集招聘、房屋、二手、DMV 和本地服务。',
    label: '看看 OpenAA'
  };

  const config = path.startsWith('/usa/dmv/')
    ? dmvConfig
    : groups.find(group => group.match.includes(path)) || defaultConfig;

  function trackedUrl(destination, content) {
    const url = new URL(destination, 'https://openaa.com');
    url.searchParams.set('utm_source', 'toolku');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', campaign);
    url.searchParams.set('utm_content', content);
    return url.href;
  }

  function prepareLink(link, destination, content) {
    link.href = trackedUrl(destination, content);
    link.target = '_blank';
    link.rel = 'noopener';
    link.addEventListener('click', () => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'openaa_click', {
          toolku_page: campaign,
          cta_position: content,
          destination
        });
      }
    });
  }

  function updateHeader() {
    const nav = document.querySelector('.site-header nav');
    if (!nav) return;
    let link = [...nav.querySelectorAll('a')].find(item => item.href.includes('openaa.com'));
    if (!link) {
      link = document.createElement('a');
      nav.appendChild(link);
    }
    link.classList.add('openaa-nav-link');
    link.textContent = 'OpenAA生活';
    prepareLink(link, '/', 'header');
  }

  function buildHomepageEntry() {
    const section = document.querySelector('.openaa-cta');
    const hero = document.querySelector('.hero');
    if (!section || !hero) return;
    section.classList.add('openaa-home-entry');
    section.innerHTML = '<div><div class="cta-eyebrow">OpenAA · 美国华人生活</div><h2>工具算完了，生活信息接着找</h2><p>按你现在要办的事情直接进入，不用重新搜索。</p></div><div class="openaa-entry-links"><a data-destination="/jobs">找工作</a><a data-destination="/housing">找房屋</a><a data-destination="/marketplace">二手市场</a><a data-destination="/dmv">DMV题库</a></div>';
    section.querySelectorAll('[data-destination]').forEach(link => {
      prepareLink(link, link.dataset.destination, 'home_quick_entry');
    });
    hero.insertAdjacentElement('afterend', section);
  }

  function buildContextualEntry() {
    let section = document.querySelector('.openaa-cta');
    if (!section) {
      section = document.createElement('section');
      section.className = 'openaa-cta';
      const insertBefore = document.querySelector('.source-panel, .usa-related');
      if (insertBefore) insertBefore.insertAdjacentElement('beforebegin', section);
      else document.querySelector('main')?.insertAdjacentElement('afterend', section);
    }

    section.classList.add('openaa-next-step');
    section.innerHTML = `<div><div class="cta-eyebrow">下一步 · OpenAA</div><h2>${config.title}</h2><p>${config.description}</p></div><a>${config.label} →</a>`;
    prepareLink(section.querySelector('a'), config.destination, 'next_step');

    const toolPage = document.querySelector('.tool-page');
    if (toolPage && toolPage.contains(section)) {
      const result = toolPage.querySelector('.result');
      const note = result?.nextElementSibling?.classList.contains('note') ? result.nextElementSibling : null;
      (note || result)?.insertAdjacentElement('afterend', section);
    }
  }

  function updateOtherLinks() {
    document.querySelectorAll('a[href*="openaa.com"]:not(.openaa-nav-link):not(.openaa-next-step a):not(.openaa-home-entry a)').forEach(link => {
      let destination = '/';
      try { destination = new URL(link.href).pathname || '/'; } catch (_) {}
      prepareLink(link, destination, 'supporting_link');
    });
  }

  function init() {
    updateHeader();
    if (path === '/' || path === '/tools/' || path === '/tools/index.html') buildHomepageEntry();
    else if (path !== '/404.html') buildContextualEntry();
    updateOtherLinks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
