import React from 'react';
import { Check, Star, RotateCcw, Share2, TrendingUp, Users, DollarSign } from 'lucide-react';
import Header from '../Header';
import StickyCTABar from '../StickyCTABar';
import Footer from '../Footer';
import { CallToActionBanner, MeetTeam } from './LandingPage';

export default function AboutUs() {
    return (
        <div className="bg-white overflow-x-hidden">
            <Header />
            <div className="p-6 md:p-12" style={{
                backgroundImage: `url('/Bg.png')`, backgroundPosition: 'left center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
            }}>
                <div className="max-w-7xl mx-auto">
                    <div className="rounded-lg p-6 md:p-12">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* Left Content */}
                            <div className="flex-1 max-w-2xl">


                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                                    About Us{' '}

                                </h2>
                                {/* <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                Be the first.
              </h3> */}

                                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                    Founded in 2017, Zuvomo is a full-stack growth platform built for Web3
                                    startups. Over the past 8 years, we've raised over $800 million across
                                    100+ projects, supporting visionary teams through every phase of
                                    growth. From token launches to liquidity and business development, we
                                    design a data-backed roadmap for CEOs.
                                </p>

                                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                    Founded in 2017, Zuvomo is a full-stack growth platform built for Web3
                                    startups. Over the past 8 years, we've raised over $800 million across
                                    100+ projects, supporting visionary teams through every phase of
                                    growth. From token launches to liquidity and business development, we
                                    design a data-backed roadmap for CEOs.
                                </p>

                                <button className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                    Join Now
                                </button>
                            </div>

                            {/* Right Investment Card */}
                            <div className="flex-1 max-w-md w-full">
                                <img src='public/about.png' alt='About Us' className='w-full h-auto rounded-lg shadow-xl' />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="min-h-screen bg-gray-50">
                {/* Header Section */}
                <div className="container mx-auto px-6 py-16">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        {/* Left Content */}
                        <div className="flex-1 max-w-2xl">
                            <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                                <span className="text-blue-500">$800 Million+</span>
                                <span className="text-gray-900 block mt-2">
                                    Raised in Investments for Startups
                                </span>
                            </h1>

                            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                Launched in 2017, Zuvomo has helped 150+ startups in the crypto and
                                blockchain industry with strategies, capital, and partnerships to
                                dominate markets.
                            </p>

                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                From acing launches to creating successful ROI-driven marketing
                                strategies, we are a founder's reliable ally.
                            </p>

                            <button className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
                                Join Now
                            </button>
                        </div>

                        {/* Right Image */}
                        <div className="flex-1 max-w-lg">
                            <img
                                src='public/raise.png'
                                alt="Team working together"
                                className="w-full h-auto rounded-lg shadow-xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="bg-white py-16">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-12">
                            {/* Our Values */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6">
                                    <Check className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Value over everything. For investors, we shortlist only the best projects and provide
                                    adding value and insight, to the portfolio. and that they get not only funding but also a
                                    strategic partner.
                                </p>
                            </div>

                            {/* Company Goal */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6">
                                    <Star className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Company Goal</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    In a world where most projects fail within the first year, Zuvomo exists to defy the statistics.
                                    Our mission is to guide and educates themselves to make your startup an
                                    unforgettable project.
                                </p>
                            </div>

                            {/* Satisfaction Guarantee */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6">
                                    <RotateCcw className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Satisfaction Guarantee</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Your success is ours. We have helped hundreds of businesses achieve their dreams and wish to
                                    do the same for you. We offer a 100% satisfaction guarantee.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CallToActionBanner/>
             <MeetTeam/>
            <Footer />
            <StickyCTABar />
        </div>
    );
}