import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  const stats = [
    { icon: '🍽️', value: '50K+', label: 'Meals Redistributed' },
    { icon: '🤝', value: '200+', label: 'Partner NGOs' },
    { icon: '👥', value: '10K+', label: 'Volunteers' },
    { icon: '🏘️', value: '150+', label: 'Cities Covered' }
  ];

  const features = [
    {
      icon: '📍',
      title: 'Real-Time Location Matching',
      description: 'GPS-based matching connects donors with the nearest NGOs and volunteers for fastest food redistribution.'
    },
    {
      icon: '🔔',
      title: 'Instant Notifications',
      description: 'Automated alerts notify stakeholders about new donations, claims, and delivery updates in real-time.'
    },
    {
      icon: '📊',
      title: 'Impact Analytics',
      description: 'Track food saved, meals delivered, and community impact with powerful data-driven insights.'
    },
    {
      icon: '🛡️',
      title: 'Food Safety Checks',
      description: 'Built-in food freshness validation ensures quality standards before redistribution.'
    },
    {
      icon: '🚗',
      title: 'Volunteer Coordination',
      description: 'Efficient logistics management connects volunteers for pickup and delivery assignments.'
    },
    {
      icon: '🤖',
      title: 'Smart Matching',
      description: 'Intelligent algorithms match food surplus with demand based on type, quantity, and urgency.'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Donors Post Surplus',
      description: 'Restaurants, hotels, and households share details about available surplus food.',
      icon: '📝'
    },
    {
      step: '02',
      title: 'System Matches',
      description: 'Our platform finds the best match based on location, food type, and urgency.',
      icon: '🎯'
    },
    {
      step: '03',
      title: 'Volunteers Collect',
      description: 'Assigned volunteers pick up the food ensuring safe handling and transport.',
      icon: '🚚'
    },
    {
      step: '04',
      title: 'Food Reaches Those in Need',
      description: 'NGOs distribute the food to communities, shelters, and individuals in need.',
      icon: '💚'
    }
  ];

  const roles = [
    {
      icon: '🏪',
      title: 'Food Donors',
      description: 'Restaurants, hotels, event venues, households, and food processing units',
      action: 'Start Donating',
      color: 'primary'
    },
    {
      icon: '🏛️',
      title: 'NGOs & Food Banks',
      description: 'Non-governmental organizations coordinating food collection and distribution',
      action: 'Join as NGO',
      color: 'info'
    },
    {
      icon: '🙋',
      title: 'Volunteers',
      description: 'Dedicated individuals helping with pickup, transport, and delivery of food',
      action: 'Volunteer Now',
      color: 'warning'
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        
        <div className="hero-content container">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Bridging Surplus to Need
            </div>
            <h1 className="hero-title">
              Reduce <span className="gradient-text">Food Waste</span>,
              <br />Fight <span className="gradient-text-alt">Hunger</span>
            </h1>
            <p className="hero-subtitle">
              A technology-driven platform connecting food surplus generators with NGOs, 
              volunteers, and communities in need. Together, we can ensure no edible food goes to waste.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg" id="hero-cta">
                    Get Started Free →
                  </Link>
                  <Link to="/login" className="btn btn-ghost btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card hero-card-1 glass-card">
              <span className="hero-card-icon">🍛</span>
              <div>
                <strong>50 servings</strong>
                <span>available now</span>
              </div>
              <span className="badge badge-success">Live</span>
            </div>
            <div className="hero-card hero-card-2 glass-card">
              <span className="hero-card-icon">📍</span>
              <div>
                <strong>2.5 km away</strong>
                <span>nearest pickup</span>
              </div>
            </div>
            <div className="hero-card hero-card-3 glass-card">
              <span className="hero-card-icon">✅</span>
              <div>
                <strong>Delivered!</strong>
                <span>120 meals saved</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-stats container">
          {stats.map((stat, i) => (
            <div key={i} className="hero-stat" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="hero-stat-icon">{stat.icon}</span>
              <span className="hero-stat-value">{stat.value}</span>
              <span className="hero-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Four Simple Steps</h2>
            <p className="section-subtitle">
              From surplus to sustenance — our streamlined process ensures food reaches those 
              in need quickly and safely.
            </p>
          </div>

          <div className="steps-grid">
            {howItWorks.map((step, i) => (
              <div key={i} className="step-card" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="step-number">{step.step}</div>
                <span className="step-icon">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {i < howItWorks.length - 1 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Powered by Technology</h2>
            <p className="section-subtitle">
              Our platform leverages cutting-edge technology to make food redistribution 
              efficient, transparent, and impactful.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="section roles-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Join Us</span>
            <h2 className="section-title">Who Can Join?</h2>
            <p className="section-subtitle">
              Whether you have surplus food, need food, or want to help — there's a role for everyone.
            </p>
          </div>

          <div className="roles-grid">
            {roles.map((role, i) => (
              <div key={i} className={`role-card glass-card role-${role.color}`}>
                <span className="role-icon">{role.icon}</span>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
                <Link to="/register" className={`btn btn-${role.color === 'primary' ? 'primary' : role.color === 'info' ? 'secondary' : 'warning'} btn-sm`}>
                  {role.action}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to Make a Difference?</h2>
            <p>Join thousands of donors, NGOs, and volunteers who are already fighting food waste and hunger.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Join FoodBridge Today →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="logo-icon">🌿</span>
              <span className="logo-text">FoodBridge</span>
              <p>Bridging surplus food to those in need through technology.</p>
            </div>
            <div className="footer-links">
              <h4>Platform</h4>
              <Link to="/register">Get Started</Link>
              <Link to="/login">Login</Link>
            </div>
            <div className="footer-links">
              <h4>About</h4>
              <a href="#">How It Works</a>
              <a href="#">Our Mission</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 FoodBridge. Built for a hunger-free world. 💚</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
