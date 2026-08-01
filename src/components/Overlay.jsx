import React, { useState, useEffect } from 'react'
import resumeData from '../data/resumeData.json'
import Typewriter from './Typewriter'
import useAudio from '../hooks/useAudio'

const Overlay = ({ section, setSection }) => {
    const { name, tagline, experience, skills, projects, education, contact } = resumeData
    const { playHover, playClick } = useAudio()

    const handleNav = (idx) => {
        playClick()
        setSection(idx)
    }

    const handleNext = () => {
        playClick()
        setSection((prev) => (prev + 1) % 4)
    }

    return (
        <div className="overlay-container">
            <header>
                <div className="logo" onMouseEnter={playHover}>_HARVINDER.EXE</div>
                <div className="status">SYS.O.K | SEC.LEVEL: MAX</div>
            </header>

            <nav className="main-nav">
                {['PROFILE', 'EXPERIENCE', 'SKILLS', 'PROJECTS'].map((label, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleNav(idx)}
                        onMouseEnter={playHover}
                        className={`nav-btn ${section === idx ? 'active' : ''}`}
                    >
                        {`[0${idx}] ${label}`}
                    </button>
                ))}
            </nav>

            <main className="content-panel">
                {section === 0 && (
                    <div className="section profile">
                        <h1 className="glitch" data-text={name}>
                            <Typewriter text={name} speed={50} />
                        </h1>
                        <p className="subtitle">
                            <Typewriter text={tagline} speed={30} />
                        </p>
                        <div className="contact-grid">
                            <div className="contact-item"><span>EMAIL:</span> {contact.email}</div>
                            <div className="contact-item"><span>PHONE:</span> {contact.phone}</div>
                            <div className="contact-item"><span>LINKEDIN:</span> {contact.linkedin}</div>
                        </div>

                        <div className="education-block">
                            <h3>// EDUCATION_LOG</h3>
                            {education.map((edu, i) => (
                                <div key={i} className="edu-item">
                                    <h4>{edu.degree}</h4>
                                    <p>{edu.institution} <span className="highlight">|</span> {edu.date}</p>
                                    <p className="score">SCORE: {edu.score}</p>
                                </div>
                            ))}
                        </div>

                        <div className="awards-block">
                            <h3>// AWARDS_LOG</h3>
                            {resumeData.awards.map((award, i) => (
                                <div key={i} className="award-item">
                                    <strong>{award.title}</strong> - {award.issuer} ({award.year})
                                    <p>{award.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {section === 1 && (
                    <div className="section experience">
                        <h3>// EXPERIENCE_LOG</h3>
                        <div className="scroll-container">
                            {experience.map((exp, i) => (
                                <div key={i} className="job-card">
                                    <div className="job-header">
                                        <h4>{exp.role} <span className="at">@</span> {exp.company}</h4>
                                        <span className="period">{exp.period}</span>
                                    </div>
                                    <ul className="job-details">
                                        {exp.details.map((point, j) => (
                                            <li key={j}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {section === 2 && (
                    <div className="section skills">
                        <h3>// SKILL_MATRIX</h3>
                        <div className="skills-grid">
                            {Object.entries(skills).map(([category, items]) => (
                                <div key={category} className="skill-category">
                                    <h4>{category.toUpperCase()}</h4>
                                    <div className="tags">
                                        {items.map((skill, k) => (
                                            <span key={k} className="tag">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="certs-block">
                            <h3>// CERTIFICATES</h3>
                            <ul>
                                {resumeData.certificates.map((cert, c) => (
                                    <li key={c}>{cert.name} - {cert.issuer} ({cert.year})</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {section === 3 && (
                    <div className="section projects">
                        <h3>// PROJECT_FILES</h3>
                        <div className="projects-grid">
                            {projects.map((proj, i) => (
                                <div key={i} className="project-card">
                                    <div className="project-header">
                                        <h4>{proj.name}</h4>
                                        <span>{proj.date}</span>
                                    </div>
                                    <div className="tech-stack">
                                        {proj.technologies.map(t => <span key={t}>[{t}]</span>)}
                                    </div>
                                    <ul className="project-details">
                                        {proj.details.map((d, k) => <li key={k}>{d}</li>)}
                                    </ul>
                                    {proj.link && proj.link !== '#' && (
                                        <a href={proj.link} target="_blank" rel="noopener noreferrer" className="proj-link" onMouseEnter={playHover}>
                                            [LAUNCH_PROTOCOL]
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <button
                className="nav-btn next-btn"
                onClick={handleNext}
                onMouseEnter={playHover}
                style={{
                    position: 'absolute',
                    bottom: '2rem',
                    right: '2rem',
                    pointerEvents: 'auto',
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid #00ff41'
                }}
            >
                CONTINUE FLIGHT &gt;&gt;
            </button>
        </div>
    )
}

export default Overlay
