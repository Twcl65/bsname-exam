"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Anchor, BookOpen, Users, BarChart3, Shield, Clock, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'about']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Anchor className="size-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">BSNAME-ExamSys</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className={`font-medium transition-colors ${
                activeSection === 'home' 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className={`font-medium transition-colors ${
                activeSection === 'features' 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className={`font-medium transition-colors ${
                activeSection === 'about' 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              About
            </button>
          </nav>
          
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative min-h-[500px] flex items-center justify-center overflow-hidden pt-10">
        {/* Modern Gradient Background */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
          <div className="absolute inset-0 bg-[url('/bg-pic.jpg')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center max-w-6xl">
          {/* Modern Status Badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-8 shadow-lg">
            <div className="relative">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-white font-medium text-sm tracking-wide">Live & Ready to Use</span>
            </div>
            
          {/* Main Heading with Modern Typography */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              <span className="block">Welcome to</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                BSNAME
              </span>
              <span className="block text-3xl md:text-4xl lg:text-5xl font-bold text-white/90">
                Exam System
              </span>
          </h1>
          </div>
          
          {/* Enhanced Description */}
          <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed max-w-3xl mx-auto font-light">
            A comprehensive online examination platform designed for educational institutions. 
            <span className="block mt-1 text-base text-white/70">
            Manage exams, track progress, and deliver seamless learning experiences.
            </span>
          </p>
          
          {/* Modern CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/auth/login">
              <Button 
                size="lg" 
                className="group relative px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
              </Button>
            </Link>
           
            <button 
              onClick={() => scrollToSection('features')}
              className="group flex items-center gap-3 px-6 py-4 text-white/80 hover:text-white font-medium transition-all duration-300"
            >
              <span>Explore Features</span>
              <div className="w-6 h-6 rounded-full border-2 border-white/40 group-hover:border-white transition-colors duration-300 flex items-center justify-center">
                <svg className="w-3 h-3 transform group-hover:translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>
          
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-12 bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              Key Features
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Everything you need for
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                modern exam management
              </span>
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Powerful tools and features designed to streamline your examination process.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Card className="relative border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-5 h-5 text-white" />
              </div>
                  <CardTitle className="text-base font-bold text-gray-900 mb-2">Question Bank</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Comprehensive question management with multiple question types and subjects.
              </CardDescription>
            </CardHeader>
          </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Card className="relative border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-5 h-5 text-white" />
              </div>
                  <CardTitle className="text-base font-bold text-gray-900 mb-2">User Management</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                Role-based access control for students, instructors, and administrators.
              </CardDescription>
            </CardHeader>
          </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Card className="relative border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-5 h-5 text-white" />
              </div>
                  <CardTitle className="text-base font-bold text-gray-900 mb-2">Progress Tracking</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Real-time analytics and detailed progress reports with visual insights.
              </CardDescription>
            </CardHeader>
          </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Card className="relative border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-5 h-5 text-white" />
              </div>
                  <CardTitle className="text-base font-bold text-gray-900 mb-2">Secure Exams</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                Advanced security features to ensure exam integrity and prevent cheating.
              </CardDescription>
            </CardHeader>
          </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Card className="relative border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-5 h-5 text-white" />
              </div>
                  <CardTitle className="text-base font-bold text-gray-900 mb-2">Timed Assessments</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                Flexible timing controls and automatic submission for time-bound examinations.
              </CardDescription>
            </CardHeader>
          </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Card className="relative border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-5 h-5 text-white" />
              </div>
                  <CardTitle className="text-base font-bold text-gray-900 mb-2">Performance Analytics</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                Detailed insights into student performance and learning outcomes.
              </CardDescription>
            </CardHeader>
          </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About the Developers Section */}
      <section id="about" className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">About the Developers</h2>
            <p className="text-base text-gray-600">Meet the talented team behind BSNAME Exam System</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Project Manager */}
            <Link href="https://www.facebook.com/james.lindongan20" target="_blank" rel="noopener noreferrer">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow text-center cursor-pointer">
                <CardHeader className="p-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-blue-200">
                    <Image
                      src="/project.jpg"
                      alt="Project Manager"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-sm">Project Manager</CardTitle>
                  <CardDescription className="text-xs">
                    Oversees project planning and coordination.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Programmer */}
            <Link href="https://www.facebook.com/thomas.labares" target="_blank" rel="noopener noreferrer">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow text-center cursor-pointer">
              <CardHeader className="p-4">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-orange-200">
                  <Image
                    src="/programmer.jpg"
                    alt="Programmer"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-sm">Programmer</CardTitle>
                <CardDescription className="text-xs">
                  Develops and maintains the core functionality.
                </CardDescription>
              </CardHeader>
            </Card>
            </Link>

            {/* System Analyst */}
            <Link href="https://www.facebook.com/moniquelacern28" target="_blank" rel="noopener noreferrer">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow text-center cursor-pointer">
              <CardHeader className="p-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-purple-200">
                  <Image
                    src="/system.jpg"
                    alt="System Analyst"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-sm">System Analyst</CardTitle>
                <CardDescription className="text-xs">
                  Analyzes system requirements and designs solutions.
                </CardDescription>
              </CardHeader>
            </Card>
            </Link>

            {/* UI/UX Designer 1 */}
            <Link href="https://www.facebook.com/share/19iW1XLz9t/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow text-center cursor-pointer">
             
              <CardHeader className="p-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-orange-200">
                  <Image
                    src="/ui.jpg"
                    alt="UI/UX Designer 1"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-sm">UI/UX Designer 1</CardTitle>
                <CardDescription className="text-xs">
                  Creates intuitive user interfaces and experiences.
                </CardDescription>
              </CardHeader>
            </Card>
            </Link>

            {/* UI/UX Designer 2 */}
            <Link href="https://www.facebook.com/share/1BGXEfKxf9/" target="_blank" rel="noopener noreferrer">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow text-center cursor-pointer">
              <CardHeader className="p-4">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-orange-200">
                  <Image
                    src="/ux.jpg"
                    alt="UI/UX Designer 2"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-sm">UI/UX Designer 2</CardTitle>
                <CardDescription className="text-xs">
                  Focuses on accessibility and responsive design.
                </CardDescription>
              </CardHeader>
            </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-base mb-6 opacity-90">
            Join thousands of educators and students using our platform
          </p>
          <Link href="/auth/login">
            <Button size="lg" variant="secondary">
              Access Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 BSNAME Exam System. All rights reserved.
          </p>
        </div>
      </footer>
      </div>
    )
}
