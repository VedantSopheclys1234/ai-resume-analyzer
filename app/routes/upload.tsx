import { useState } from 'react'
import { useNavigate, type NavigateFunction } from 'react-router';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar'
import { usePuterStore } from '~/lib/puter';
import {convertPdfToImage} from "~/lib/pdf2img";
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from '~/constants';



const upload = () => {
    const {  auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate: NavigateFunction = useNavigate(); 

     const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
          setIsProcessing(true);
          setStatusText('Uploading your resume...');
          const uploadedFile: any = await fs.upload([file]);

          if(!uploadedFile) return setStatusText('Failed to upload file. Please try again.')
          
            setStatusText('Conveying to image...')

            const imageFile = await convertPdfToImage(file);
            if(!imageFile) return setStatusText('Failed to convert PDF to image. Please try again.')
                setStatusText('Uploading image for analysis...')
                if(!imageFile.file) return setStatusText('Image file is missing. Please try again.');
                const uploadedImage = await fs.upload([imageFile.file]);
                if(!uploadedImage) return setStatusText('Failed to upload image. Please try again.');
                
                setStatusText('Preparing data...');
                
                const uuid = generateUUID();

                const data = {
                    id: uuid,
                    resumePath: uploadedFile[0].path,
                    imagePath: uploadedImage.path,
                    companyName, jobTitle,jobDescription,
                    feedback: '',
                }
                await kv.set(`resume:${uuid}`,JSON.stringify(data));

                setStatusText('Analyzing resume...');

                const feedback = await ai.feedback(
                    uploadedFile[0].path,
                    prepareInstructions({ jobTitle, jobDescription, AIResponseFormat: '' })

                )
                if(!feedback) return setStatusText('Failed to analyze resume. Please try again.')
                const feedbackText = typeof feedback.message.content == 'string' 
            ? feedback.message.content 
            : feedback.message.content[0].text;

            data.feedback = JSON.parse(feedbackText);
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText(`Analysis complete! Redirecting...`);
            console.log(data);
            
        }
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const handleFileSelect = (file: File | null) => {
        setFile(file);
    }
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form: HTMLFormElement | null = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;
        
        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }
    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading ">
                    <h1>Smart Feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full h-auto " />
                        </>
                    ) : (
                        <h2>Drop your resume for ATS  scorechecking</h2>
                    )}
                    { !isProcessing && (
                        <form action="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8 ">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default upload