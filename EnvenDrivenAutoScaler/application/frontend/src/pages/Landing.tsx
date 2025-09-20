import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Smartphone, 
  DollarSign,
  TrendingUp,
  Target,
  Users,
  CheckCircle,
  Star,
  Zap,
  PieChart,
  Calendar,
  Bell,
  Lock,
  Globe,
  Award,
  ArrowDown
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export const Landing: React.FC = () => {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-800/80 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                ExpenseTracker
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                Reviews
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                Contact
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-800 dark:text-blue-200 text-sm font-medium mb-8">
            <Zap className="w-4 h-4 mr-2" />
            Trusted by 50,000+ users worldwide
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
            Take Control of Your
            <span className="block bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Financial Future
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            The most intuitive expense tracking platform that helps you understand your spending, 
            set meaningful budgets, and achieve your financial goals with beautiful insights and smart automation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto text-lg px-8 py-4"
              onClick={scrollToFeatures}
            >
              See How It Works
              <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">50K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">$2.5M+</div>
              <div className="text-gray-600 dark:text-gray-300">Money Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">4.9★</div>
              <div className="text-gray-600 dark:text-gray-300">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Master Your Finances
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Powerful features designed to give you complete control over your money with minimal effort
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Smart Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Get detailed insights into your spending patterns with beautiful, interactive charts and personalized recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Smart Budgeting
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Set intelligent budgets that adapt to your lifestyle with automatic alerts and spending optimization suggestions.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Mobile First
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Track expenses on-the-go with our responsive design that works perfectly on any device, anywhere.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Bank-Level Security
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Your financial data is protected with enterprise-grade encryption and security protocols.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bell className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Smart Notifications
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Stay on track with intelligent alerts for budget limits, unusual spending, and bill reminders.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Multi-Currency
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Track expenses in multiple currencies with real-time exchange rates and automatic conversions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start tracking your expenses and achieving your financial goals in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Sign Up & Connect
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Create your free account in seconds. No credit card required, no hidden fees.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-teal-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Add Your Expenses
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Quickly log expenses with our intuitive interface. Upload receipts and categorize automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Get Insights & Save
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Discover spending patterns, set budgets, and watch your savings grow with actionable insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our users say about their experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "ExpenseTracker completely changed how I manage my finances. The insights are incredible and helped me save $500 last month!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">SJ</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Sarah Johnson</div>
                    <div className="text-gray-500 dark:text-gray-400">Marketing Manager</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "The budgeting features are fantastic. I finally understand where my money goes and can plan better for the future."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">MC</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Mike Chen</div>
                    <div className="text-gray-500 dark:text-gray-400">Software Developer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "Simple, beautiful, and powerful. This app made expense tracking actually enjoyable. Highly recommend!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">ER</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Emily Rodriguez</div>
                    <div className="text-gray-500 dark:text-gray-400">Freelance Designer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Free</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
                  <span className="text-gray-600 dark:text-gray-300">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Up to 100 transactions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Basic analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">3 budget categories</span>
                  </li>
                </ul>
                <Link to="/register" className="block">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pro</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">$9</span>
                  <span className="text-gray-600 dark:text-gray-300">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Unlimited transactions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Unlimited budgets</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Receipt scanning</span>
                  </li>
                </ul>
                <Link to="/register" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-600">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">$29</span>
                  <span className="text-gray-600 dark:text-gray-300">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Everything in Pro</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Team collaboration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600 dark:text-gray-300">Custom integrations</span>
                  </li>
                </ul>
                <Link to="/register" className="block">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have already transformed their financial lives with ExpenseTracker.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">ExpenseTracker</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The most intuitive expense tracking platform that helps you understand your spending and achieve your financial goals.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ExpenseTracker. All rights reserved. Built with React and modern web technologies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};