import React from 'react';
import { Check, Star, RotateCcw, Share2, TrendingUp, Users, DollarSign } from 'lucide-react';
import Header from '../Header';
import StickyCTABar from '../StickyCTABar';
import Footer from '../Footer';
import { CallToActionBanner, MeetTeam } from './LandingPage';

export default function AboutUs() {
    function handleJoinNow() {
        window.location.href = '/signup';
    }
    return (
        <div className="bg-white overflow-x-hidden">
            <Header />
            <div className="p-6 md:p-12" style={{
                backgroundImage: `url('/Bg.png')`, backgroundPosition: 'left center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
            }}>
                <div className="max-w-7xl mx-auto">
                    <div className="rounded-lg p-6 md:p-6">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* Left Content */}
                            <div className="flex-1 max-w-2xl">


                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
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

                                <button onClick={handleJoinNow} className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                    JOIN NOW
                                </button>
                            </div>

                            {/* Right Investment Card */}
                            <div className="flex-1 max-w-md w-full">
                                <img src='/about.png' alt='About Us' className='w-full h-auto rounded-lg shadow-xl' />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="rounded-lg p-6 md:p-6 mt-4">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        {/* Left Content */}
                        <div className="flex-1 max-w-2xl">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
                                <span className="text-[rgb(44,145,213)]">$800 Million+</span>
                                <span className="text-gray-900 block mt-2">
                                    Raised! We’ve got you covered
                                </span>
                            </h1>

                            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                We know the journey of a founder is never easy. The late nights, sleepless sprints, managing teams, DAOs, and token communities, the pressure to deliver on protocol milestones and governance votes. We salute that passion. We feel it because we live it. Your fight is our fight.
                            </p>

                            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                We love what we do because, like you, we believe in a new internet. We believe in decentralization, we believe in DeFi protocols, we believe in RWA, we believe in NFTs, Layer 2 scaling, and DAOs. We have been part of this ecosystem since 2017, true OGs who have witnessed bull runs, bear markets, and everything in between, and stayed the course.
                            </p>
                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                Together, let’s transform the ecosystem and build the trustless, decentralized internet of the future.
                            </p>

                            <button onClick={handleJoinNow} className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
                                JOIN NOW
                            </button>
                        </div>

                        {/* Right Image */}
                        <div className="flex-1 max-w-lg">
                            <img
                                src='/raise.png'
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
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2F3A63] rounded-full mb-6">
                                    <Check className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Values</h3>
                                <p className="text-gray-600 leading-relaxed">
                                   We champion builders who choose real utility over hype and create lasting change in Web3.
                                </p>
                            </div>

                            {/* Company Goal */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2F3A63] rounded-full mb-6">
                                    <Star className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Goal</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    To help bold ideas break the noise and become movements that shape the future of the internet.
                                </p>
                            </div>

                            {/* Satisfaction Guarantee */}
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2F3A63] rounded-full mb-6">
                                    <RotateCcw className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Shared Success</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    When our founders win, the entire community wins - your growth is our badge of honor
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