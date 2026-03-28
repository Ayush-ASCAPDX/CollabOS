// Shared sidebar
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const appSidebar = document.getElementById('appSidebar');
const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const sidebarStateKey = 'collabos_sidebar_collapsed';

if (window.lucide && typeof window.lucide.createIcons === 'function') {
  window.lucide.createIcons();
}

if (appSidebar) {
  const menuIcon = mobileMenuBtn ? mobileMenuBtn.querySelector('.menu-icon') : null;
  const closeIcon = mobileMenuBtn ? mobileMenuBtn.querySelector('.close-icon') : null;
  const sidebarLinks = appSidebar.querySelectorAll('.sidebar-link');

  const syncMobileToggle = () => {
    if (!mobileMenuBtn || !menuIcon || !closeIcon) return;
    const isOpen = document.body.classList.contains('sidebar-mobile-open');
    menuIcon.classList.toggle('hidden', isOpen);
    closeIcon.classList.toggle('hidden', !isOpen);
  };

  const syncBackdrop = () => {
    if (!sidebarBackdrop) return;
    sidebarBackdrop.classList.toggle('hidden', !document.body.classList.contains('sidebar-mobile-open'));
  };

  const closeMobileSidebar = () => {
    document.body.classList.remove('sidebar-mobile-open');
    syncMobileToggle();
    syncBackdrop();
  };

  const applyDesktopSidebarState = () => {
    if (window.innerWidth < 1024) {
      document.body.classList.remove('sidebar-collapsed');
      return;
    }

    const isCollapsed = localStorage.getItem(sidebarStateKey) === '1';
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
  };

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) return;

      document.body.classList.toggle('sidebar-mobile-open');
      syncMobileToggle();
      syncBackdrop();
    });
  }

  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', () => {
      if (window.innerWidth < 1024) return;

      const shouldCollapse = !document.body.classList.contains('sidebar-collapsed');
      document.body.classList.toggle('sidebar-collapsed', shouldCollapse);
      localStorage.setItem(sidebarStateKey, shouldCollapse ? '1' : '0');
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  sidebarLinks.forEach((link) => {
    const linkUrl = new URL(link.href, window.location.href);
    const isCurrentPage = linkUrl.pathname === window.location.pathname;

    if (isCurrentPage) {
      link.classList.add('active');
    }

    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        closeMobileSidebar();
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      closeMobileSidebar();
    }
    applyDesktopSidebarState();
  });

  applyDesktopSidebarState();
  syncMobileToggle();
  syncBackdrop();
}

// Hide login links on first visit
const firstVisitKey = 'collabos_first_visit';
const loginLinks = document.querySelectorAll('.login-link');
const isFirstVisit = !localStorage.getItem(firstVisitKey);

if (isFirstVisit) {
  loginLinks.forEach(link => link.classList.add('hidden'));
  localStorage.setItem(firstVisitKey, '1');
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') {
      return;
    }
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const chromeOffset = document.body.classList.contains('app-shell') ? 24 : 80;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - chromeOffset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// Animate elements on scroll
const observerOptions = {
  root: null,
  rootMargin: '0px 0px -20px 0px',
  threshold: 0.02
};

const animateOnScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Add animation to cards
const animatedElements = document.querySelectorAll(
  '.problem-card, .step-card, .testimonial-card, .project-card, .stat-card, .feature-block, .auth-card'
);

animatedElements.forEach((el, index) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = `opacity 0.2s ease ${index * 0.02}s, transform 0.2s ease ${index * 0.02}s`;
  animateOnScroll.observe(el);
});

// Animate stats counter
const statValues = document.querySelectorAll('.stat-value');
let statsAnimated = false;

const animateStats = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !statsAnimated) {
      statsAnimated = true;
      
      statValues.forEach(stat => {
        const finalValue = stat.textContent;
        const isPercentage = finalValue.includes('%');
        const isHours = finalValue.includes('hr');
        const numericValue = parseInt(finalValue.replace(/[^0-9]/g, ''));
        
        let current = 0;
        const increment = numericValue / 50;
        const duration = 1500;
        const stepTime = duration / 50;
        
        const counter = setInterval(() => {
          current += increment;
          if (current >= numericValue) {
            current = numericValue;
            clearInterval(counter);
          }
          
          if (isPercentage) {
            stat.textContent = Math.floor(current) + '%';
          } else if (isHours) {
            stat.textContent = Math.floor(current) + 'hr';
          } else if (finalValue.includes('+')) {
            stat.textContent = Math.floor(current) + '+';
          } else {
            stat.textContent = Math.floor(current);
          }
        }, stepTime);
      });
    }
  });
}, { threshold: 0.5 });

statValues.forEach(stat => {
  animateStats.observe(stat);
});

// Parallax effect for floating cards
const floatingCards = document.querySelectorAll('.floating-card');

document.addEventListener('mousemove', (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  
  floatingCards.forEach((card, index) => {
    const speed = (index + 1) * 2;
    const xOffset = (x - 0.5) * speed;
    const yOffset = (y - 0.5) * speed;
    
    card.style.transform = `translate(${xOffset}px, ${yOffset}px) ${card.dataset.rotation || ''}`;
  });
});

// Store initial rotation values
floatingCards.forEach(card => {
  const style = window.getComputedStyle(card);
  const transform = style.transform;
  if (transform && transform !== 'none') {
    card.dataset.rotation = transform;
  }
});

// Button ripple effect
const buttons = document.querySelectorAll('.btn-primary, .btn-outline');

buttons.forEach(button => {
  button.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: none;
      width: 100px;
      height: 100px;
      left: ${x - 50}px;
      top: ${y - 50}px;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
    `;
    
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
});

// Add ripple animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Typing effect for hero title (optional enhancement)
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
  heroTitle.style.opacity = '1';
}

// Add loading animation
window.addEventListener('load', () => {
  const pageLoader = document.getElementById('pageLoader');
  const pathname = window.location.pathname;
  const isLoaderPage =
    pathname.endsWith('/') ||
    pathname.endsWith('/index.html') ||
    pathname.endsWith('index.html') ||
    pathname.endsWith('/community.html') ||
    pathname.endsWith('community.html') ||
    pathname.endsWith('/projects.html') ||
    pathname.endsWith('projects.html');

  if (pageLoader && isLoaderPage) {
    window.setTimeout(() => {
      pageLoader.classList.add('hidden');
      window.setTimeout(() => pageLoader.remove(), 220);
    }, 1000);
  }

  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.2s ease';
  
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });
});

// Community builder card expand
const builderCards = document.querySelectorAll('.builder-card[data-name]');

if (builderCards.length) {
  const builderScroller = document.querySelector('.builder-scroll');
  const builderScrollLeftBtn = document.querySelector('.builder-scroll-btn-left');
  const builderScrollRightBtn = document.querySelector('.builder-scroll-btn-right');
  const filterGroups = document.querySelectorAll('.filter-options[data-filter-group]');
  const activeFilters = {
    role: new Set(['all']),
    goal: new Set(['all']),
    availability: new Set(['all'])
  };

  const applyFilters = () => {
    builderCards.forEach(card => {
      const role = card.dataset.filterRole || '';
      const goal = card.dataset.filterGoal || '';
      const availability = card.dataset.filterAvailability || '';

      const matchRole = activeFilters.role.has('all') || activeFilters.role.has(role);
      const matchGoal = activeFilters.goal.has('all') || activeFilters.goal.has(goal);
      const matchAvailability = activeFilters.availability.has('all') || activeFilters.availability.has(availability);

      card.style.display = matchRole && matchGoal && matchAvailability ? '' : 'none';
    });
    updateBuilderScrollButtons();
  };

  const updateBuilderScrollButtons = () => {
    if (!builderScroller || !builderScrollLeftBtn || !builderScrollRightBtn) return;
    const maxScroll = builderScroller.scrollWidth - builderScroller.clientWidth;
    builderScrollLeftBtn.disabled = builderScroller.scrollLeft <= 4;
    builderScrollRightBtn.disabled = builderScroller.scrollLeft >= maxScroll - 4;
  };

  if (builderScroller && builderScrollLeftBtn && builderScrollRightBtn) {
    const scrollAmount = () => Math.max(280, Math.floor(builderScroller.clientWidth * 0.7));

    builderScrollLeftBtn.addEventListener('click', () => {
      builderScroller.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });

    builderScrollRightBtn.addEventListener('click', () => {
      builderScroller.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    builderScroller.addEventListener('scroll', updateBuilderScrollButtons, { passive: true });
    window.addEventListener('resize', updateBuilderScrollButtons);
  }

  filterGroups.forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      const groupName = group.dataset.filterGroup;
      const value = btn.dataset.filter;
      const set = activeFilters[groupName];

      if (value === 'all') {
        set.clear();
        set.add('all');
        group.querySelectorAll('.filter-chip').forEach(chip => {
          chip.classList.toggle('active', chip.dataset.filter === 'all');
        });
      } else {
        set.delete('all');
        if (set.has(value)) {
          set.delete(value);
          btn.classList.remove('active');
        } else {
          set.add(value);
          btn.classList.add('active');
        }

        if (set.size === 0) {
          set.add('all');
          group.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === 'all');
          });
        } else {
          const allChip = group.querySelector('.filter-chip[data-filter="all"]');
          if (allChip) allChip.classList.remove('active');
        }
      }
      applyFilters();
    });
  });

  const setExpandedContent = (card) => {
    const quoteEl = card.querySelector('.builder-quote');
    const statsEl = card.querySelector('.builder-stats');
    const quote = card.dataset.quote || '';
    const stats = (card.dataset.stats || '').split('|');

    if (quoteEl) {
      quoteEl.textContent = `“${quote}”`;
    }

    if (statsEl) {
      statsEl.innerHTML = '';
      for (let i = 0; i < stats.length; i += 2) {
        const value = stats[i];
        const label = stats[i + 1];
        if (!value || !label) continue;
        const stat = document.createElement('div');
        stat.className = 'builder-stat';
        stat.innerHTML = `<span>${value}</span><p>${label}</p>`;
        statsEl.appendChild(stat);
      }
    }
  };

  builderCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) {
        return;
      }

      const alreadyOpen = card.classList.contains('expanded');
      builderCards.forEach(c => c.classList.remove('expanded'));
      if (!alreadyOpen) {
        setExpandedContent(card);
        card.classList.add('expanded');
      }
    });
  });

  applyFilters();
  updateBuilderScrollButtons();
}

// FAQ interactions
const faqList = document.getElementById('faqList');
const faqSearch = document.getElementById('faqSearch');
const faqCategoryButtons = document.querySelectorAll('.faq-category');

if (faqList) {
  const faqItems = Array.from(faqList.querySelectorAll('.faq-item'));
  let activeFaqCategory = 'all';

  const applyFaqFilters = () => {
    const query = faqSearch ? faqSearch.value.trim().toLowerCase() : '';

    faqItems.forEach(item => {
      const category = item.dataset.category || '';
      const keywords = item.dataset.keywords || '';
      const questionText = item.querySelector('.faq-question span')?.textContent.toLowerCase() || '';
      const answerText = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';
      const matchesCategory = activeFaqCategory === 'all' || activeFaqCategory === category;
      const matchesQuery =
        !query ||
        questionText.includes(query) ||
        answerText.includes(query) ||
        keywords.includes(query);

      item.style.display = matchesCategory && matchesQuery ? '' : 'none';
    });
  };

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-question');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(entry => entry.classList.remove('open'));
      faqItems.forEach(entry => {
        const btn = entry.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  faqCategoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      faqCategoryButtons.forEach(entry => entry.classList.remove('active'));
      button.classList.add('active');
      activeFaqCategory = button.dataset.category || 'all';
      applyFaqFilters();
    });
  });

  if (faqSearch) {
    faqSearch.addEventListener('input', applyFaqFilters);
  }

  applyFaqFilters();
}

// Project hub interactions
const projectGrid = document.getElementById('projectGrid');
const projectSearch = document.getElementById('projectSearch');
const projectFilterGroups = document.querySelectorAll('.projects-filter-options[data-project-filter-group]');
const projectModal = document.getElementById('projectModal');

if (projectGrid) {
  const projectCards = Array.from(projectGrid.querySelectorAll('.project-hub-card'));
  const projectBookmarks = Array.from(projectGrid.querySelectorAll('.project-bookmark'));
  const activeProjectFilters = {
    category: new Set(['all']),
    role: new Set(['all']),
    status: new Set(['all'])
  };

  const applyProjectFilters = () => {
    const query = projectSearch ? projectSearch.value.trim().toLowerCase() : '';

    projectCards.forEach(card => {
      const name = card.dataset.projectName?.toLowerCase() || '';
      const category = card.dataset.projectCategory || '';
      const role = card.dataset.projectRole || '';
      const status = card.dataset.projectStatus || '';

      const matchesSearch = !query || name.includes(query);
      const matchesCategory = activeProjectFilters.category.has('all') || activeProjectFilters.category.has(category);
      const matchesRole = activeProjectFilters.role.has('all') || activeProjectFilters.role.has(role);
      const matchesStatus = activeProjectFilters.status.has('all') || activeProjectFilters.status.has(status);

      card.style.display = matchesSearch && matchesCategory && matchesRole && matchesStatus ? '' : 'none';
    });
  };

  projectFilterGroups.forEach(group => {
    group.addEventListener('click', (e) => {
      const button = e.target.closest('.projects-filter');
      if (!button) return;

      const groupName = group.dataset.projectFilterGroup;
      const value = button.dataset.projectFilter;
      const set = activeProjectFilters[groupName];

      if (value === 'all') {
        set.clear();
        set.add('all');
        group.querySelectorAll('.projects-filter').forEach(entry => {
          entry.classList.toggle('active', entry.dataset.projectFilter === 'all');
        });
      } else {
        set.delete('all');
        if (set.has(value)) {
          set.delete(value);
          button.classList.remove('active');
        } else {
          set.add(value);
          button.classList.add('active');
        }

        if (set.size === 0) {
          set.add('all');
          group.querySelectorAll('.projects-filter').forEach(entry => {
            entry.classList.toggle('active', entry.dataset.projectFilter === 'all');
          });
        } else {
          const allButton = group.querySelector('[data-project-filter="all"]');
          if (allButton) allButton.classList.remove('active');
        }
      }

      applyProjectFilters();
    });
  });

  if (projectSearch) {
    projectSearch.addEventListener('input', applyProjectFilters);
  }

  projectBookmarks.forEach((bookmark) => {
    bookmark.setAttribute('aria-pressed', 'false');
  });

  projectGrid.addEventListener('click', (e) => {
    const bookmark = e.target.closest('.project-bookmark');
    if (!bookmark) return;

    e.preventDefault();
    e.stopPropagation();
    const isActive = bookmark.classList.toggle('active');
    bookmark.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (projectModal) {
    const modalName = document.getElementById('projectModalName');
    const modalDescription = document.getElementById('projectModalDescription');
    const modalFull = document.getElementById('projectModalFull');
    const modalNeeded = document.getElementById('projectModalNeeded');
    const modalMatch = document.getElementById('projectModalMatch');
    const modalTeam = document.getElementById('projectModalTeam');
    const modalTags = document.getElementById('projectModalTags');

    const closeProjectModal = () => {
      projectModal.classList.add('hidden');
      projectModal.setAttribute('aria-hidden', 'true');
    };

    projectGrid.addEventListener('click', (e) => {
      if (e.target.closest('.project-bookmark')) {
        return;
      }

      const trigger = e.target.closest('.project-detail-trigger');
      if (!trigger) return;

      const card = trigger.closest('.project-hub-card');
      if (!card) return;

      modalName.textContent = card.dataset.projectName || '';
      modalDescription.textContent = card.dataset.projectDescription || '';
      modalFull.textContent = card.dataset.projectFull || '';
      modalNeeded.textContent = card.dataset.projectNeeded || '';
      modalMatch.textContent = `${card.dataset.projectMatch || '0'}% match`;

      modalTeam.innerHTML = '';
      (card.dataset.projectTeam || '').split(',').map(entry => entry.trim()).filter(Boolean).forEach(member => {
        const chip = document.createElement('span');
        chip.textContent = member;
        modalTeam.appendChild(chip);
      });

      modalTags.innerHTML = '';
      (card.dataset.projectTags || '').split(',').map(entry => entry.trim()).filter(Boolean).forEach(tag => {
        const chip = document.createElement('span');
        chip.textContent = tag;
        modalTags.appendChild(chip);
      });

      projectModal.classList.remove('hidden');
      projectModal.setAttribute('aria-hidden', 'false');
    });

    projectModal.addEventListener('click', (e) => {
      if (e.target.matches('[data-project-modal-close]')) {
        closeProjectModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !projectModal.classList.contains('hidden')) {
        closeProjectModal();
      }
    });
  }

  applyProjectFilters();
}

// How it works demo and FAQ
const howRole = document.getElementById('howRole');
const howGoal = document.getElementById('howGoal');
const howDemoResult = document.getElementById('howDemoResult');
const howFaqList = document.getElementById('howFaqList');

if (howRole && howGoal && howDemoResult) {
  const demoResults = {
    developer: {
      startup: { title: 'Designer + Founder Team', text: '92% match for a fast-moving startup MVP.' },
      mvp: { title: 'Product Designer + PM', text: '90% match for a small team shipping version one.' },
      'side-project': { title: 'Indie Hacker Pair', text: '88% match for a weekend side project.' }
    },
    designer: {
      startup: { title: 'Technical Founder Team', text: '94% match for a startup looking to polish onboarding and UX.' },
      mvp: { title: 'Builder + Marketer Duo', text: '91% match for an MVP team that needs interface direction.' },
      'side-project': { title: 'Creator Tool Team', text: '87% match for a design-led side build.' }
    },
    marketer: {
      startup: { title: 'Founder + Growth Team', text: '89% match for an early-stage startup focused on traction.' },
      mvp: { title: 'Launch Team', text: '86% match for a product preparing its first release.' },
      'side-project': { title: 'Creator Growth Pair', text: '84% match for a small side project with distribution needs.' }
    }
  };

  const renderHowDemo = () => {
    const role = howRole.value;
    const goal = howGoal.value;
    const result = demoResults[role]?.[goal];
    if (!result) return;

    howDemoResult.innerHTML = `
      <span class="how-demo-badge">Recommended for you</span>
      <h3>${result.title}</h3>
      <p>${result.text}</p>
    `;
  };

  howRole.addEventListener('change', renderHowDemo);
  howGoal.addEventListener('change', renderHowDemo);
  renderHowDemo();
}

if (howFaqList) {
  const howFaqItems = Array.from(howFaqList.querySelectorAll('.how-faq-item'));

  howFaqItems.forEach((item) => {
    const trigger = item.querySelector('.how-faq-question');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      howFaqItems.forEach((entry) => {
        entry.classList.remove('open');
        const button = entry.querySelector('.how-faq-question');
        if (button) button.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// Waitlist
const waitlistForm = document.getElementById('waitlistForm');

if (waitlistForm) {
  const waitlistEmail = document.getElementById('waitlistEmail');
  const waitlistName = document.getElementById('waitlistName');
  const waitlistReferralInput = document.getElementById('waitlistReferralInput');
  const waitlistUserType = document.getElementById('waitlistUserType');
  const waitlistInterest = document.getElementById('waitlistInterest');
  const waitlistSubmit = document.getElementById('waitlistSubmit');
  const waitlistSpinner = document.getElementById('waitlistSpinner');
  const waitlistError = document.getElementById('waitlistError');
  const waitlistSuccess = document.getElementById('waitlistSuccess');
  const waitlistSuccessText = document.getElementById('waitlistSuccessText');
  const waitlistPosition = document.getElementById('waitlistPosition');
  const waitlistLiveCount = document.getElementById('waitlistLiveCount');
  const waitlistReferralSource = document.getElementById('waitlistReferralSource');
  const waitlistReferralCode = document.getElementById('waitlistReferralCode');
  const waitlistLeaderboard = document.getElementById('waitlistLeaderboard');
  const waitlistWhatsApp = document.getElementById('waitlistWhatsApp');
  const waitlistTwitter = document.getElementById('waitlistTwitter');
  const waitlistCopyLink = document.getElementById('waitlistCopyLink');
  const waitlistCopyFeedback = document.getElementById('waitlistCopyFeedback');
  const waitlistBuilderCount = document.getElementById('waitlistBuilderCount');
  const waitlistSpotsLeft = document.getElementById('waitlistSpotsLeft');
  const waitlistPhotoRail = document.getElementById('waitlistPhotoRail');
  const waitlistLiveTrack = document.getElementById('waitlistLiveTrack');
  const waitlistRolePills = document.querySelectorAll('#waitlistRolePills .waitlist-role-pill');
  const waitlistRevealItems = document.querySelectorAll('.waitlist-reveal');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const urlParams = new URLSearchParams(window.location.search);
  const referralCodeFromUrl = (urlParams.get('ref') || '').trim().toLowerCase();
  let shareLink = window.location.href;
  let liveCountValue = Number(waitlistLiveCount?.textContent || 127) || 127;

  const waitlistPhotos = [
    {
      src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=700&fit=crop&crop=face',
      name: 'Alex Chen',
      role: 'Full-stack Builder',
      badge: 'Builder'
    },
    {
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&h=640&fit=crop&crop=face',
      name: 'Priya Shah',
      role: 'Product Designer',
      badge: 'Designer'
    },
    {
      src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=780&fit=crop&crop=face',
      name: 'Marco Rossi',
      role: 'Founder',
      badge: 'Founder'
    },
    {
      src: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=900&h=720&fit=crop&crop=face',
      name: 'Leon Bauer',
      role: 'DevOps Engineer',
      badge: 'Builder'
    }
  ];

  const waitlistLiveItems = [
    {
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
      name: 'Alex',
      action: 'joined from Berlin'
    },
    {
      img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
      name: 'Priya',
      action: 'matched with a founder'
    },
    {
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
      name: 'Marco',
      action: 'started an AI project'
    },
    {
      img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face',
      name: 'Leon',
      action: 'invited 3 friends'
    }
  ];

  const setLiveCountUI = (count) => {
    liveCountValue = count;
    if (waitlistLiveCount) waitlistLiveCount.textContent = String(count);
    if (waitlistBuilderCount) waitlistBuilderCount.textContent = String(count);
  };

  const buildWaitlistPhotos = () => {
    if (!waitlistPhotoRail) return;
    const items = [...waitlistPhotos, ...waitlistPhotos];
    waitlistPhotoRail.innerHTML = items.map((item, index) => `
      <article class="waitlist-photo-card" style="min-height:${index % 2 === 0 ? 250 : 210}px;">
        <img src="${item.src}" alt="${item.name}" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async">
        <div class="waitlist-photo-card-meta">
          <div>
            <strong>${item.name}</strong>
            <span>${item.role}</span>
          </div>
          <span class="waitlist-photo-badge">${item.badge}</span>
        </div>
      </article>
    `).join('');
  };

  const buildWaitlistLiveTrack = () => {
    if (!waitlistLiveTrack) return;
    const items = [...waitlistLiveItems, ...waitlistLiveItems];
    waitlistLiveTrack.innerHTML = items.map((item) => `
      <div class="waitlist-live-item">
        <img class="waitlist-live-avatar" src="${item.img}" alt="${item.name}" loading="lazy" decoding="async">
        <span><strong>${item.name}</strong> ${item.action}</span>
      </div>
    `).join('');
  };

  const initWaitlistRolePills = () => {
    if (!waitlistRolePills.length || !waitlistUserType) return;
    waitlistRolePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        waitlistRolePills.forEach((entry) => entry.classList.remove('active'));
        pill.classList.add('active');
        waitlistUserType.value = pill.dataset.value || 'Founder';
      });
    });
  };

  const initWaitlistReveal = () => {
    if (!waitlistRevealItems.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    waitlistRevealItems.forEach((item) => observer.observe(item));
  };

  const initWaitlistSpotTick = () => {
    if (!waitlistSpotsLeft) return;
    let spots = Number(waitlistSpotsLeft.textContent || 87) || 87;
    window.setInterval(() => {
      if (spots > 64 && Math.random() < 0.45) {
        spots -= 1;
        waitlistSpotsLeft.textContent = String(spots);
      }
    }, 9000);
  };

  const setWaitlistError = (message) => {
    waitlistError.textContent = message;
    waitlistError.classList.toggle('hidden', !message);
  };

  const setWaitlistLoading = (isLoading) => {
    waitlistSubmit.disabled = isLoading;
    waitlistSpinner.classList.toggle('hidden', !isLoading);
    const label = waitlistSubmit.querySelector('.waitlist-submit-label');
    if (label) {
      label.textContent = isLoading ? 'Joining...' : 'Join Early Access';
    }
  };

  const updateLiveCount = async () => {
    if (!waitlistLiveCount) return;
    try {
      const response = await fetch('/api/waitlist/stats');
      if (!response.ok) return;
      const data = await response.json();
      if (typeof data.totalCount === 'number') {
        setLiveCountUI(data.totalCount);
      }
    } catch (error) {
      // Keep the fallback value rendered in HTML.
    }
  };

  const updateLeaderboard = async () => {
    if (!waitlistLeaderboard) return;

    try {
      const response = await fetch('/api/waitlist/leaderboard');
      if (!response.ok) return;
      const data = await response.json();
      const leaders = Array.isArray(data.leaders) ? data.leaders : [];

      if (!leaders.length) {
        waitlistLeaderboard.innerHTML = '<div class="waitlist-leaderboard-empty">No referrals yet. Be the first to share your invite link.</div>';
        return;
      }

      waitlistLeaderboard.innerHTML = leaders
        .map((leader, index) => `
          <div class="waitlist-leaderboard-item">
            <span class="waitlist-leaderboard-rank">#${index + 1}</span>
            <div class="waitlist-leaderboard-meta">
              <strong>${leader.name}</strong>
              <span>${leader.userType}</span>
            </div>
            <span class="waitlist-leaderboard-score">${leader.referralCount} referrals</span>
          </div>
        `)
        .join('');
    } catch (error) {
      waitlistLeaderboard.innerHTML = '<div class="waitlist-leaderboard-empty">Unable to load referrals right now.</div>';
    }
  };

  const updateShareLinks = (position, inviteLink = window.location.href) => {
    shareLink = inviteLink;
    const shareText = `I just joined the CollabOS waitlist. I'm #${position} in line.`;
    if (waitlistWhatsApp) {
      waitlistWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${inviteLink}`)}`;
    }
    if (waitlistTwitter) {
      waitlistTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(inviteLink)}`;
    }
  };

  if (referralCodeFromUrl && waitlistReferralSource) {
    waitlistReferralSource.textContent = `Referral applied from invite code ${referralCodeFromUrl}.`;
    waitlistReferralSource.classList.remove('hidden');
  }

  if (waitlistReferralInput && referralCodeFromUrl) {
    waitlistReferralInput.value = referralCodeFromUrl;
  }

  buildWaitlistPhotos();
  buildWaitlistLiveTrack();
  initWaitlistRolePills();
  initWaitlistReveal();
  initWaitlistSpotTick();
  setLiveCountUI(liveCountValue);
  updateLiveCount();
  updateLeaderboard();

  waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setWaitlistError('');

    const email = waitlistEmail.value.trim().toLowerCase();
    const name = waitlistName.value.trim();
    const referralCode = (waitlistReferralInput ? waitlistReferralInput.value.trim().toLowerCase() : '') || referralCodeFromUrl;
    const userType = waitlistUserType.value;
    const interest = waitlistInterest.value;

    if (!email) {
      setWaitlistError('Email is required.');
      return;
    }

    if (!emailRegex.test(email)) {
      setWaitlistError('Please enter a valid email address.');
      return;
    }

    setWaitlistLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          name,
          userType,
          interest,
          referralCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setWaitlistError(data.error || 'Unable to join the waitlist right now.');
        setWaitlistLoading(false);
        return;
      }

      waitlistForm.classList.add('hidden');
      waitlistSuccess.classList.remove('hidden');
      waitlistPosition.textContent = `#${data.position}`;
      if (waitlistReferralCode) {
        waitlistReferralCode.textContent = data.referralCode || 'Ready to share';
      }
      waitlistSuccessText.textContent = `You're on the waitlist. We will notify ${name || 'you'} soon when your invite is ready.`;
      if (waitlistLiveCount && typeof data.totalCount === 'number') {
        setLiveCountUI(data.totalCount);
      }
      updateShareLinks(data.position, data.referralLink || window.location.href);
      updateLeaderboard();
      setWaitlistLoading(false);
    } catch (error) {
      setWaitlistError('Unable to join the waitlist right now.');
      setWaitlistLoading(false);
    }
  });

  if (waitlistCopyLink) {
    waitlistCopyLink.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareLink);
        waitlistCopyFeedback.classList.remove('hidden');
        waitlistCopyFeedback.textContent = 'Link copied.';
        window.setTimeout(() => {
          waitlistCopyFeedback.classList.add('hidden');
        }, 1800);
      } catch (error) {
        waitlistCopyFeedback.textContent = 'Unable to copy link.';
        waitlistCopyFeedback.classList.remove('hidden');
      }
    });
  }
}

// Admin waitlist page
const adminEntriesTable = document.getElementById('adminEntriesTable');

if (adminEntriesTable) {
  const adminSearch = document.getElementById('adminSearch');
  const adminTotalCount = document.getElementById('adminTotalCount');
  const adminTopReferral = document.getElementById('adminTopReferral');
  let adminEntries = [];

  const renderAdminEntries = (entries) => {
    if (!entries.length) {
      adminEntriesTable.innerHTML = '<tr><td colspan="7" class="admin-empty">No waitlist entries found.</td></tr>';
      return;
    }

    adminEntriesTable.innerHTML = entries
      .map((entry) => `
        <tr>
          <td>#${entry.position}</td>
          <td>${entry.name || '-'}</td>
          <td>${entry.email}</td>
          <td>${entry.userType}</td>
          <td>${entry.interest}</td>
          <td>${entry.referralCount}</td>
          <td>${new Date(entry.createdAt).toLocaleDateString()}</td>
        </tr>
      `)
      .join('');
  };

  const applyAdminSearch = () => {
    const query = adminSearch ? adminSearch.value.trim().toLowerCase() : '';
    const filtered = adminEntries.filter((entry) => {
      const haystack = `${entry.name || ''} ${entry.email}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    renderAdminEntries(filtered);
  };

  const loadAdminEntries = async () => {
    try {
      const [entriesResponse, leaderboardResponse] = await Promise.all([
        fetch('/api/waitlist/entries'),
        fetch('/api/waitlist/leaderboard')
      ]);

      const entriesData = entriesResponse.ok ? await entriesResponse.json() : { entries: [] };
      const leaderboardData = leaderboardResponse.ok ? await leaderboardResponse.json() : { leaders: [] };

      adminEntries = Array.isArray(entriesData.entries) ? entriesData.entries : [];
      if (adminTotalCount) {
        adminTotalCount.textContent = String(adminEntries.length);
      }
      if (adminTopReferral) {
        const topCount = leaderboardData.leaders && leaderboardData.leaders[0] ? leaderboardData.leaders[0].referralCount : 0;
        adminTopReferral.textContent = String(topCount);
      }

      applyAdminSearch();
    } catch (error) {
      adminEntriesTable.innerHTML = '<tr><td colspan="7" class="admin-empty">Unable to load waitlist entries.</td></tr>';
    }
  };

  if (adminSearch) {
    adminSearch.addEventListener('input', applyAdminSearch);
  }

  loadAdminEntries();
}
