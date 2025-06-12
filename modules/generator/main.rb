require "CSV"
require "JSON"
require 'byebug'

class Generator
  def initialize(persona)
    setup_companies
    setup_personas
    @current_persona = @personas[persona]
    @months = 6
  end

  def generate
    @transactions = []
    @current_persona.each do |config|
      @transactions += generate_transactions(config)
    end
    @transactions
  end

  private 

  def reset_date
    today = Date.today
    @current_month = today.month - @months
    if @current_month <= 0
      @current_month = 12 - @current_month
      @current_year = today.year - 1
    else
      @current_year = today.year
    end
  end

  def increment_month
    @current_month += 1
    if @current_month == 13
      @current_month = 1
      @current_year += 1
    end
  end

  def generate_transactions(config)
    begin
      monthly_transactions(config) do
        build_transaction(config)
      end
    rescue => e
      puts [e.to_s, e.backtrace.first].join("\t")
      []
    end
  end

  def monthly_transactions(config, &block)
    transactions = []
    reset_date
    @months.times do
      determine_frequency(config).times do
        transactions << block.call
      end
      increment_month
    end
    transactions.compact
  end

  def determine_frequency(config)
    return config['frequency'].to_i unless config['frequency'].include?('-')

    from, to = config['frequency'].split('-')
    (from.to_i..to.to_i).to_a.sample.to_i
  end

  def build_transaction(config)
    # return unless ['Cuidado Pessoal'].include?(config['category'])
    return nil unless included_in_ocurrency?(config)
    day = determine_day(config)
    ({
      date: Date.new(@current_year, @current_month, day).to_s,
      description: build_description(config),
      amount: build_amount(config),
      cat: config['category'],
      subcat: config['description'],
    })
  end

  # check if config is included in ocurrency rand percentage
  def included_in_ocurrency?(config)
    @occurrencies ||= {}
    if !@occurrencies[config['organization']]
      percentage = percentage_to_f(config['occurrency'])
      @occurrencies[config['organization']] = rand() < percentage
    end
    @occurrencies[config['organization']]
  end

  # set day for config['organization'] to reuse always same day
  def determine_day(config)
    @days ||= {}
    if config['frequency'] === '1'
      @days[config['organization']] ||= rand(1..28)
      @days[config['organization']]
    else
      rand(1..28)
    end
  end

  def build_description(config)
    company_names = @companies[config['organization']]
    return config['description'].upcase if !company_names

    if config['frequency'] === '1'
      @organizations ||= {}
      @organizations[config['organization']] ||= company_names.sample
      @organizations[config['organization']]
    else
      company_names.sample
    end
  end

  def build_amount(config)
    value = config['income']&.to_f || config['outcome'].to_f
    return value if config['type'] == 'fix'
    
    (value * (1 + rand(-0.5..0.5))).round(2)
  end
  
  def setup_companies
    @companies = {}
    CSV.read('templates/companies.csv', headers: true).map do |company| 
      @companies[company['organization']] ||= []
      @companies[company['organization']] << company['company']
    end
  end

  def percentage_to_f(value)
    value.gsub('%', '').to_f/100
  end

  def setup_personas
    @personas = {}
    CSV.read('templates/personas.csv', col_sep: "\t", headers: true).map do |persona|
      @personas[persona['persona']] ||= []
      @personas[persona['persona']] << persona.to_h.except('persona')
    end
  end
end

persona = "Homem Casado 30-40 + Carro"
txs = Generator.new(persona).generate
pp txs

months = {}
analysis_data = {}
txs
  .map do |tx| 
    month_year = [Date.parse(tx[:date]).year, Date.parse(tx[:date]).month.to_s.rjust(2, '0')].join
    tx[:month] = month_year
    months[month_year] ||= { income: 0, outcome: 0 }
    tx[:amount] < 0 ? months[month_year][:outcome] += tx[:amount] : months[month_year][:income] += tx[:amount]
    tx
  end
  .group_by { |tx| [tx[:month], tx[:cat]].join('-') }
  .each_pair do |month_cat, txs|
    month, cat = month_cat.split('-')
    # use only last month and compare with 3 months before
    next unless months.keys[2..5].include?(month)
    
    # puts [month_cat, (txs.sum { |tx| tx[:amount] } / txs.size).round(2)].join("\t") 
    analysis_data[cat] ||= { cur: 0, avg: 0, var: 0 }

    # last month
    if month === months.keys.last
      analysis_data[cat][:avg] = analysis_data[cat][:avg] / 3
      analysis_data[cat][:cur] = txs.sum { |tx| tx[:amount] }
      analysis_data[cat][:var] = ((analysis_data[cat][:cur] - analysis_data[cat][:avg]) / analysis_data[cat][:avg]).round(2)
      analysis_data[cat][:per] = (cat == 'Receitas' ? analysis_data[cat][:cur] / months[month][:income] : analysis_data[cat][:cur] / months[month][:outcome]).round(2)
    else
      analysis_data[cat][:avg] += txs.sum { |tx| tx[:amount] }
    end
  end

pp months
puts analysis_data.to_json
# puts ['Resutado', txs.sum { |tx| tx[:amount] }.round(2)].join("\t")

filename = "#{persona.downcase.gsub(/[^a-z0-9\s]/, '').gsub(/\s+/, '_')}-#{Time.now.strftime("%Y%m%d%H%M%S")}.csv"
CSV.open(filename, "wb") do |csv|
  csv << ['Data', 'Descrição', 'Valor', 'desc', 'cat']
  txs.each do |hash|
    csv << hash.values
  end
end

