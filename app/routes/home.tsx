import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import Navbar from "~/components/Navbar";
import Auth from "./auth";

import { usePuterStore } from "~/lib/puter";
import { Link, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { resumes } from "~/constants";


export function meta({}: Route.MetaArgs) {
  return[
    { title: "Resumeaizer" },
    { name: "description", content: "Smart Resume analyzer to find your dream job" },
  ];  
}

export default function Home() {
  const { auth } = usePuterStore();
    const navigate = useNavigate();

    useEffect(()=> {
        if(!auth.isAuthenticated) navigate('/auth?next=/');
    }, [auth.isAuthenticated])

    return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track you Applications & Resume Ratings</h1>
        <h2>Review your submissions and check AI-powered feedback</h2>
      </div>
    

      {Resumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
      )}

      {Resumes && resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}

      {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
      )}
    </section>
  </main>
}