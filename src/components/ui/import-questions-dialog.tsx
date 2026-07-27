'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import * as XLSX from 'xlsx'

interface Subject {
  id: number
  name: string
  description?: string
  picture?: string
}

interface Subtopic {
  id: number
  name: string
  subjectId: number
}

interface ImportedQuestion {
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  difficulty: string
  explanation?: string
  selected?: boolean
}

interface ImportQuestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function ImportQuestionsDialog({ open, onOpenChange, onImportComplete }: ImportQuestionsDialogProps) {
  const [importedQuestions, setImportedQuestions] = useState<ImportedQuestion[]>([])
  const [importPreviewDialogOpen, setImportPreviewDialogOpen] = useState(false)
  const [importSelectedSubject, setImportSelectedSubject] = useState<string>('')
  const [importSelectedSubtopic, setImportSelectedSubtopic] = useState<string>('')
  const [importSubtopics, setImportSubtopics] = useState<Subtopic[]>([])
  const [importing, setImporting] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Fetch subjects for import dialog
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/subjects')
        if (response.ok) {
          const result = await response.json()
          const data = result.data || result // Handle both wrapped and unwrapped responses
          // Convert date strings to Date objects
          const subjectsWithDates = data.map((subject: { id: number; name: string; description?: string; picture?: string; subtopics?: Array<{ id: number; name: string; subject_id: number; created_at: string }>; created_at: string }) => ({
            ...subject,
            createdAt: new Date(subject.created_at),
            subtopics: subject.subtopics ? subject.subtopics.map((subtopic: { id: number; name: string; subject_id: number; created_at: string }) => ({
              ...subtopic,
              createdAt: new Date(subtopic.created_at)
            })) : []
          }))
          setSubjects(subjectsWithDates)
        }
      } catch (error) {
        console.error('Error fetching subjects:', error)
        setSubjects([]) // Ensure subjects is always an array
      }
    }
    fetchSubjects()
  }, [])

  // Fetch subtopics when subject changes
  useEffect(() => {
    if (importSelectedSubject) {
      const fetchSubtopics = async () => {
        try {
          const response = await fetch(`/api/subjects/${importSelectedSubject}/subtopics`)
          if (response.ok) {
            const result = await response.json()
            const data = result.data || result // Handle both wrapped and unwrapped responses
            const subtopicsWithDates = data.map((subtopic: { id: number; name: string; subject_id: number; created_at: string }) => ({
              ...subtopic,
              createdAt: new Date(subtopic.created_at)
            }))
            setImportSubtopics(subtopicsWithDates)
          }
        } catch (error) {
          console.error('Error fetching subtopics:', error)
          setImportSubtopics([]) // Ensure subtopics is always an array
        }
      }
      fetchSubtopics()
    } else {
      setImportSubtopics([])
    }
  }, [importSelectedSubject])

  const parseCSVFile = (file: File): Promise<ImportedQuestion[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          const questions: ImportedQuestion[] = []
          
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
            if (row.length >= 7) {
              const question: ImportedQuestion = {
                question: row[0] || '',
                optionA: row[1] || '',
                optionB: row[2] || '',
                optionC: row[3] || '',
                optionD: row[4] || '',
                correctAnswer: row[5]?.toUpperCase() || '',
                difficulty: row[6]?.toLowerCase() || 'medium',
                explanation: row[7] || '',
                selected: true
              }
              
              if (question.question && question.optionA && question.optionB && 
                  question.optionC && question.optionD && question.correctAnswer) {
                questions.push(question)
              }
            }
          }
          resolve(questions)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const parseExcelFile = (file: File): Promise<ImportedQuestion[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          const questions: ImportedQuestion[] = []
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as (string | number | null)[]
            if (row && row.length >= 7) {
              const question: ImportedQuestion = {
                question: row[0]?.toString() || '',
                optionA: row[1]?.toString() || '',
                optionB: row[2]?.toString() || '',
                optionC: row[3]?.toString() || '',
                optionD: row[4]?.toString() || '',
                correctAnswer: row[5]?.toString().toUpperCase() || '',
                difficulty: row[6]?.toString().toLowerCase() || 'medium',
                explanation: row[7]?.toString() || '',
                selected: true
              }
              
              if (question.question && question.optionA && question.optionB && 
                  question.optionC && question.optionD && question.correctAnswer) {
                questions.push(question)
              }
            }
          }
          resolve(questions)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileUpload = async (file: File) => {
    try {
      let questions: ImportedQuestion[] = []
      
      if (file.name.endsWith('.csv')) {
        questions = await parseCSVFile(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        questions = await parseExcelFile(file)
      } else {
        alert('Please select a CSV or Excel file')
        return
      }
      
      if (questions.length === 0) {
        alert('No valid questions found in the file')
        return
      }
      
      setImportedQuestions(questions)
      setImportPreviewDialogOpen(true)
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Error parsing file. Please check the format.')
    } finally {
      // File parsing completed
    }
  }

  const checkForDuplicates = async (questions: ImportedQuestion[]) => {
    try {
      const response = await fetch(`/api/questions?subtopic_id=${importSelectedSubtopic}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error('Failed to fetch existing questions')
      }
      
      const existingQuestions = result.data || []
      const duplicates: { question: ImportedQuestion; reason: string }[] = []
      const uniqueQuestions: ImportedQuestion[] = []
      
      for (const question of questions) {
        const isDuplicate = existingQuestions.some((existing: { question_text: string; option_a_text: string; option_b_text: string; option_c_text: string; option_d_text: string; correct_answer: string; difficulty_level: string }) => {
          // Check for exact question text match with same difficulty
          const textMatch = existing.question_text?.toLowerCase().trim() === question.question.toLowerCase().trim()
          const difficultyMatch = existing.difficulty_level?.toLowerCase() === question.difficulty.toLowerCase()
          
          if (textMatch && difficultyMatch) {
            return true
          }
          
          // Check for similar question text (fuzzy match)
          const similarity = calculateSimilarity(existing.question_text?.toLowerCase().trim() || '', question.question.toLowerCase().trim())
          if (similarity > 0.8 && difficultyMatch) {
            return true
          }
          
          return false
        })
        
        if (isDuplicate) {
          duplicates.push({ 
            question, 
            reason: 'Question with same text and difficulty already exists' 
          })
        } else {
          uniqueQuestions.push(question)
        }
      }
      
      return { duplicates, uniqueQuestions }
    } catch (error) {
      console.error('Error checking for duplicates:', error)
      throw error
    }
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const handleBulkImport = async () => {
    if (!importSelectedSubject || !importSelectedSubtopic) {
      alert('Please select both subject and subtopic')
      return
    }
    
    const selectedQuestions = importedQuestions.filter(q => q.selected)
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question to import')
      return
    }
    
    setImporting(true)
    try {
      // Check for duplicates
      const { duplicates, uniqueQuestions } = await checkForDuplicates(selectedQuestions)
      
      if (duplicates.length > 0) {
        const duplicateText = duplicates.map(d => `"${d.question.question.substring(0, 50)}..."`).join('\n')
        const proceed = confirm(
          `Found ${duplicates.length} duplicate question(s) that will be skipped:\n\n${duplicateText}\n\nDo you want to proceed with importing ${uniqueQuestions.length} unique questions?`
        )
        
        if (!proceed) {
          setImporting(false)
          return
        }
      }
      
      if (uniqueQuestions.length === 0) {
        alert('All selected questions are duplicates. No questions to import.')
        setImporting(false)
        return
      }
      
      // Import only unique questions
      for (const question of uniqueQuestions) {
        const questionData = {
          subtopicId: importSelectedSubtopic,
          questionText: question.question,
          optionAText: question.optionA,
          optionBText: question.optionB,
          optionCText: question.optionC,
          optionDText: question.optionD,
          correctAnswer: question.correctAnswer,
          difficultyLevel: question.difficulty,
          explanation: question.explanation || '',
          points: 1
        }
        
        const response = await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData),
        })
        
        if (!response.ok) {
          throw new Error(`Failed to import question: ${question.question}`)
        }
      }
      
      const message = duplicates.length > 0 
        ? `Successfully imported ${uniqueQuestions.length} questions. ${duplicates.length} duplicates were skipped.`
        : `Successfully imported ${uniqueQuestions.length} questions`
      
      alert(message)
      setImportPreviewDialogOpen(false)
      setImportedQuestions([])
      setImportSelectedSubject('')
      setImportSelectedSubtopic('')
      onOpenChange(false) // Close the main import dialog
      onImportComplete()
    } catch (error) {
      console.error('Error importing questions:', error)
      alert('Error importing questions. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const toggleQuestionSelection = (index: number) => {
    const updated = [...importedQuestions]
    updated[index].selected = !updated[index].selected
    setImportedQuestions(updated)
  }

  const updateQuestion = (index: number, field: keyof ImportedQuestion, value: string) => {
    const updated = [...importedQuestions]
    updated[index] = { ...updated[index], [field]: value }
    setImportedQuestions(updated)
  }

  return (
    <>
      {/* Import File Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Questions</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import questions. Download the template for the correct format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">Select File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file)
                  }
                }}
                className="mt-1"
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Expected format:</p>
              <p>Question, Option A, Option B, Option C, Option D, Correct Answer (A/B/C/D), Difficulty (easy/medium/hard), Explanation (optional)</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/excel-template.csv'
                  link.download = 'excel-template.csv'
                  link.click()
                }}
              >
                Download Template
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={importPreviewDialogOpen} onOpenChange={setImportPreviewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-none sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-8xl">
          <DialogHeader>
            <DialogTitle>Review and Edit Questions</DialogTitle>
            <DialogDescription>
              Review the imported questions, make any necessary edits, and select which ones to import.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Subject and Subtopic Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="import-subject">Subject</Label>
                <select
                  value={importSelectedSubject}
                  onChange={(e) => setImportSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  {subjects && subjects.length > 0 && subjects.map((subject) => (
                    <option key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="import-subtopic">Subtopic</Label>
                <select
                  value={importSelectedSubtopic}
                  onChange={(e) => setImportSelectedSubtopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subtopic</option>
                  {importSubtopics && importSubtopics.length > 0 && importSubtopics.map((subtopic) => (
                    <option key={subtopic.id} value={subtopic.id.toString()}>
                      {subtopic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Questions ({importedQuestions.filter(q => q.selected).length} selected)
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = importedQuestions.map(q => ({ ...q, selected: true }))
                      setImportedQuestions(updated)
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = importedQuestions.map(q => ({ ...q, selected: false }))
                      setImportedQuestions(updated)
                    }}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {importedQuestions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={question.selected}
                        onCheckedChange={() => toggleQuestionSelection(index)}
                      />
                      <span className="font-medium">Question {index + 1}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                          value={question.explanation || ''}
                          onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Option A</Label>
                        <Input
                          value={question.optionA}
                          onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Option B</Label>
                        <Input
                          value={question.optionB}
                          onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Option C</Label>
                        <Input
                          value={question.optionC}
                          onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Option D</Label>
                        <Input
                          value={question.optionD}
                          onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <select
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <select
                          value={question.difficulty}
                          onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportPreviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkImport} 
              disabled={importing || !importSelectedSubject || !importSelectedSubtopic}
            >
              {importing ? 'Importing...' : `Import ${importedQuestions.filter(q => q.selected).length} Questions`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
